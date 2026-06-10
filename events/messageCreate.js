const { Events, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Sistem Cooldown Anti-Spam EXP (Tersimpan di RAM, bukan di file)
const xpCooldowns = new Set();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;
        
        // ==========================================
        // 1. MESIN PENGECEK CAPTCHA 
        // ==========================================
        if (message.channel.name.startsWith('verify-')) {
            if (!client.captchaCodes) client.captchaCodes = new Map();
            const expectedCode = client.captchaCodes.get(message.author.id);

            if (expectedCode && message.channel.topic === message.author.id) {
                // Hapus toUpperCase agar wajib case-sensitive
                if (message.content === expectedCode) {
                    const settings = client.checkDatabase(message.guild.id);
                    const unvRole = message.guild.roles.cache.get(settings.unverifiedRoleId);
                    const verRole = message.guild.roles.cache.get(settings.verifiedRoleId);

                    if (unvRole) await message.member.roles.remove(unvRole).catch(()=>{});
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setTitle('✅ VERIFICATION SUCCESSFUL!')
                        .setDescription('Server access will open in 1 minute. This channel will be destroyed at the same time, please wait...')
                        .setFooter({ text: 'Welcome to the outpost!' });
                        
                    message.reply({ embeds: [successEmbed] }).catch(()=>{});
                    
                    client.captchaCodes.delete(message.author.id);
                    if (client.captchaAttempts) client.captchaAttempts.delete(message.author.id);
                    
                    setTimeout(async () => {
                // Re-fetch the member to check if they are still in the server
                const memberStillHere = await message.guild.members.fetch(message.author.id).catch(()=>null);

                if (memberStillHere && verRole) {
                    await memberStillHere.roles.add(verRole).catch(()=>{});

                    // --- 🔥 TAMBAHAN: LOGGING KE MODERATION LOG (LULUS CAPTCHA) 🔥 ---
                    let logChannel = null;
                    const logChanId = settings.modLogChannelId;
                    
                    if (logChanId) {
                        logChannel = message.guild.channels.cache.get(logChanId) || await message.guild.channels.fetch(logChanId).catch(() => null);
                    } else {
                        logChannel = message.guild.channels.cache.find(c => c.name === 'moderation-logs' || c.name === 'mod-logs');
                    }

                    if (logChannel) {
                        const embedLog = new EmbedBuilder()
                            .setColor('#2ECC71') // Warna Hijau (Tanda Sukses)
                            .setAuthor({ 
                                name: `System Action | ${memberStillHere.user.username}`, 
                                iconURL: memberStillHere.user.displayAvatarURL({ dynamic: true }) 
                            })
                            .setDescription(
                                `**USER**\n<@${memberStillHere.user.id}> | ${memberStillHere.user.username}\n` +
                                `**STAFF**\n<@${client.user.id}> (Auto-System)\n` +
                                `**ACTION**\nRole Added (Verified)\n` +
                                `**REASON**\nPassed CAPTCHA Verification\n\n` +
                                `**ROLE GIVEN:** <@&${settings.verifiedRoleId}>`
                            )
                            .setTimestamp();

                        await logChannel.send({ embeds: [embedLog] }).catch(() => {});
                    }
                    // -----------------------------------------------------------------
                }

                // Check if the channel still exists before deleting (prevent crash if manual...)
                const channelStillHere = await message.guild.channels.fetch(message.channel.id).catch(()=>null);

                if (channelStillHere) {
                    await channelStillHere.delete().catch(()=>{});
                }
            }, 60000);
                    
                } else {
                    // --- 3 STRIKES AUTO-KICK SYSTEM ---
                    if (!client.captchaAttempts) client.captchaAttempts = new Map();
                    let attempts = client.captchaAttempts.get(message.author.id) || 0;
                    attempts++;
                    client.captchaAttempts.set(message.author.id, attempts);

                    if (attempts >= 3) {
                        client.captchaAttempts.delete(message.author.id);
                        message.member.kick('Failed CAPTCHA 3 times')
                            .then(() => {
                                message.channel.send('❌ **Verification FAILED 3 times! User has been kicked.** Dismantling channel in 10 seconds...');
                                setTimeout(() => message.channel.delete().catch(() => {}), 10000);
                            })
                            .catch(() => {
                                message.reply('❌ **Error:** Could not kick user, but they failed 3 times. Please contact Commander!');
                            });
                    } else {
                        // --- 🔥 TERMUX BYPASS: GENERATE GAMBAR VIA API 🔥 ---
                        
                        // 1. Buat 6 karakter acak (Tanpa huruf O dan angka 0 agar tidak ambigu)
                        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
                        let newCode = "";
                        for (let i = 0; i < 6; i++) {
                            newCode += charset.charAt(Math.floor(Math.random() * charset.length));
                        }
                        
                        client.captchaCodes.set(message.author.id, newCode);

                        // 2. Beri tahu user sisa percobaan
                        const warnMsg = await message.reply(`❌ **Incorrect code!** You have **${3 - attempts}** attempt(s) left. \n🔄 Generating a NEW CAPTCHA...`);

                        // 3. Render gambar menggunakan DummyImage API
                        const captchaUrl = `https://dummyimage.com/250x100/2f3136/ffffff.png?text=${newCode}`;
                        
                        const captchaAttachment = new AttachmentBuilder(captchaUrl, { name: 'captcha.png' });
                        
                        // 4. Kirim gambar baru ke player
                        await message.channel.send({
                            content: `**Please type the 6 characters you see in this new image:**`,
                            files: [captchaAttachment]
                        });
                        
                        // Hapus pesan "Generating..." agar chat rapi
                        setTimeout(() => warnMsg.delete().catch(()=>{}), 3000);
                    }
                }
                return; 
            }
        }

        // ==========================================
        // 2. SISTEM AUTOMOD & RADAR KEAMANAN
        // ==========================================
        try {
            const guildId = message.guild.id;
            const settings = client.checkDatabase(guildId);
            const contentLower = message.content.toLowerCase();
            const contentRaw = message.content;

            const badWords = settings[guildId].badWords || [];
            const allowedLinkChannels = settings[guildId].linkAllowedChannels || [];
            const isLinkAllowedChannel = allowedLinkChannels.includes(message.channel.id);
            const isCommand = contentLower.startsWith(`${client.PREFIX.toLowerCase()} `);
            const hasAdminPerm = message.member?.permissions?.has(PermissionFlagsBits.ManageMessages) || false;
            let isViolating = false;

            const sendAutoModLog = async (reason, originalContent) => {
                try {
                    let logChannelId = settings[guildId].modLogChannelId;
                    let logChannel = null;
                    if (logChannelId) {
                        logChannel = message.guild.channels.cache.get(logChannelId) || await message.guild.channels.fetch(logChannelId).catch(()=>null);
                    } else {
                        logChannel = message.guild.channels.cache.find(c => c.name.includes('mod'));
                    }
                    if (!logChannel) return;

                    let caseId = "000000";
                    try {
                        // 🚀 BACA DARI MESIN RAM SETTINGS (Super Cepat!)
                        const guildSettings = client.checkDatabase(guildId);
                        guildSettings.caseCount = (guildSettings.caseCount || 0) + 1;
                        
                        // Simpan ke hardisk secara Asinkron di latar belakang
                        fs.writeFile(client.SETTINGS_FILE, JSON.stringify(client.databaseCache, null, 2), (err) => {
                            if (err) console.error("Gagal save caseCount AutoMod:", err);
                        });
                        
                        caseId = guildSettings.caseCount.toString().padStart(6, '0');
                    } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

                    const safeContent = originalContent.length > 1000 ? originalContent.substring(0, 1000) + "..." : originalContent;
                    const logEmbed = new EmbedBuilder().setColor('#ED4245').setAuthor({ name: `AutoMod | ${message.author.username}` }).setDescription(`**USER**\n<@${message.author.id}> | ${message.author.username}\n**STAFF**\nAutoMod\n**REASON**\n${reason}\n**MESSAGE CONTENT**\n${safeContent}\n\n**CASE ID:** ${caseId}`).setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(async () => {});
                } catch (error) {}
            };

            // Radar Anti-Invite
            if (!isCommand && !hasAdminPerm) {
                const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
                if (inviteRegex.test(contentRaw) && settings[guildId].antiInvite === true) {
                    isViolating = true;
                    await message.delete().catch(()=>{});
                    sendAutoModLog('🛡️ ANTI-INVITE: Blocked Server Link', contentRaw);
                    message.channel.send(`⚠️ <@${message.author.id}>, **Action Blocked!** Sharing external Discord invite links is strictly prohibited in this outpost!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
                    return; 
                }
            }

            // Radar Kata Kasar
            if (!isViolating && !isCommand && badWords.length > 0) {
                const safeWords = badWords.map(w => w.trim().toLowerCase()).filter(w => w !== '');
                if (safeWords.some(word => contentLower.includes(word))) {
                    isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Triggered Word Filter', contentRaw);
                    message.channel.send(`⚠️ <@${message.author.id}>, Please, mind your language!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
                }
            }

            // Radar Link
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+)/gi;
            if (!isViolating && !isCommand && !isLinkAllowedChannel && linkRegex.test(contentLower) && !hasAdminPerm) {
                isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Posted a Link', contentRaw);
                message.channel.send(`🔗 <@${message.author.id}>, sending links is not allowed in this channel!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
            }

            // Radar Caps Lock
            if (!isViolating && !isCommand && contentRaw.length > 15 && !hasAdminPerm) {
                const capsCount = contentRaw.replace(/[^A-Z]/g, '').length;
                if ((capsCount / contentRaw.length) * 100 > 70) {
                    isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Excessive Caps Lock', contentRaw);
                    message.channel.send(`🔠 <@${message.author.id}>, please turn off your Caps Lock!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
                }
            }

            if (isViolating) return; 

            // ==========================================
            // 3. SISTEM RPG CHAT LEVELING (Fase 1)
            // ==========================================
            if (!isCommand) {
            const userId = message.author.id;

            if (!xpCooldowns.has(userId)) {
                const guildId = message.guild.id;

                // 1. Tarik Data Profil dari RAM (Super Cepat!)
                const userData = client.getProfile(guildId, userId);

                // 2. Tambah XP
                const gainedXP = Math.floor(Math.random() * 11) + 15;
                userData.xp += gainedXP;

                // 3. Logika Naik Level
                const currentLevel = userData.level;
                const nextLevelXP = currentLevel * currentLevel * 100;

                if (userData.xp >= nextLevelXP) {
                    userData.level += 1;

                    // Tarik Settings Level Channel dari RAM (Anti-Lag!)
                    const settings = client.checkDatabase(guildId);
        
                    // 🔥 PERBAIKAN: Langsung ambil propertinya tanpa [guildId]
                    const levelChannelId = settings.levelChannelId;

                    const levelChannel = levelChannelId ? message.guild.channels.cache.get(levelChannelId) : null;
                    const targetChannel = levelChannel || message.channel;

                    const levelUpEmbed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setTitle('🎉 LEVEL UP!')
                        .setDescription(`Congratulations <@${userId}>!\nYou have reached **Level ${userData.level}**! Keep exploring the outpost.`)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

                    targetChannel.send({ content: `<@${userId}>`, embeds: [levelUpEmbed] }).catch(()=>{});
                }

                // 4. Simpan Profil secara Asinkron
                client.saveProfile();

                xpCooldowns.add(userId);

                setTimeout(() => {
                    xpCooldowns.delete(userId);
                }, 60000);
            }
        }

            // ==========================================
            // 4. AFK SYSTEM & COMMAND EXECUTION
            // ==========================================
            // --- 🔥 SISTEM AFK ASINKRON (Anti-Freeze & Kompatibel) 🔥 ---
        fs.readFile(client.AFK_FILE, 'utf8', (err, data) => {
            if (err) return;
            let afkData = {};
            try { afkData = JSON.parse(data); } catch (e) {}
            let afkChanged = false;

            if (afkData[guildId] && afkData[guildId][message.author.id]) {
                delete afkData[guildId][message.author.id];
                afkChanged = true;
                message.channel.send(`👋 Welcome back **<@${message.author.id}>**, I removed your AFK.`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000));
            }

            if (message.mentions.users.size > 0 && afkData[guildId]) {
                message.mentions.users.forEach(user => {
                    if (afkData[guildId][user.id]) {
                        const afkInfo = afkData[guildId][user.id];
                        const timeAgo = Math.floor(afkInfo.timestamp / 1000);
                        message.channel.send(`💤 **${user.username}** is AFK: ${afkInfo.reason} *(since <t:${timeAgo}:R>)*`);
                    }
                });
            }

            // Simpan perubahan secara diam-diam di background (Tanpa 'Sync')
            if (afkChanged) {
                fs.writeFile(client.AFK_FILE, JSON.stringify(afkData, null, 2), (err) => {});
            }
        });
        // -----------------------------------------------------------

            if (!contentLower.startsWith(client.PREFIX.toLowerCase())) return;
            const args = contentRaw.slice(client.PREFIX.length).trim().split(/\s+/);
            if (args.length === 0) return;

            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            const isRealAdmin = message.member?.permissions?.has(PermissionFlagsBits.ManageGuild) || false;
            const isCustomAdmin = settings[guildId].authorizedUsers.includes(message.author.id);

            message.reply = (content) => message.channel.send(content);

            if (!command) return;

            // 🔥 GLOBAL FIREWALL 
            const adminCommands = [
                'kick', 'ban', 'tempban', 'unban', 'warn', 'unwarn', 'clearwarn', 'history', 'purge', 
                'mute', 'unmute', 'crt', 'rmv', 'set', 'wcm', 'access', 'lock', 'unlock', 'slowmode', 
                'suggestion', 'rolesetup', 'verifysetup', 'announce', 'schedule', 'fixverify', 'antiinvite', 'word', 'link'
            ];

            if (adminCommands.includes(command.name)) {
                if (!isRealAdmin && !isCustomAdmin) {
                    return message.reply('❌ **Access Denied:** You do not have the Outpost Commander authority to use this command!');
                }
            }

            let execMessage = message;
            if (isCustomAdmin && message.member) {
                execMessage = new Proxy(message, {
                    get: (target, prop) => {
                        if (prop === 'member') {
                            return new Proxy(target.member, {
                                get: (mTarget, mProp) => {
                                    if (mProp === 'permissions') return { has: () => true };
                                    const val = mTarget[mProp];
                                    return typeof val === 'function' ? val.bind(mTarget) : val;
                                }
                            });
                        }
                        const val = target[prop];
                        return typeof val === 'function' ? val.bind(target) : val;
                    }
                });
            }

            try { 
                await command.executePrefix(execMessage, args, client.SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin);
            } catch (error) { 
                console.error(error);
            }
        } catch (error) { 
            console.error("Critical Message Event Error:", error); 
        }
    },
};