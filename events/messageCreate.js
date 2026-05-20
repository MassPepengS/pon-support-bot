const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        try {
            const guildId = message.guild.id;
            const settings = client.checkDatabase(guildId);
            const contentLower = message.content.toLowerCase();
            const contentRaw = message.content;

            const badWords = settings[guildId].badWords || [];
            const allowedLinkChannels = settings[guildId].linkAllowedChannels || [];
            const isLinkAllowedChannel = allowedLinkChannels.includes(message.channel.id);
            const isCommand = contentLower.startsWith(`${client.PREFIX.toLowerCase()} `);
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
                        let db = JSON.parse(fs.readFileSync(client.SETTINGS_FILE, 'utf8'));
                        if (!db[guildId]) db[guildId] = {};
                        db[guildId].caseCount = (db[guildId].caseCount || 0) + 1;
                        fs.writeFileSync(client.SETTINGS_FILE, JSON.stringify(db, null, 2));
                        caseId = db[guildId].caseCount.toString().padStart(6, '0');
                    } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

                    const safeContent = originalContent.length > 1000 ? originalContent.substring(0, 1000) + "..." : originalContent;
                    const logEmbed = new EmbedBuilder().setColor('#ED4245').setAuthor({ name: `AutoMod | ${message.author.username}` }).setDescription(`**USER**\n<@${message.author.id}> | ${message.author.username}\n**STAFF**\nAutoMod\n**REASON**\n${reason}\n**MESSAGE CONTENT**\n${safeContent}\n\n**CASE ID:** ${caseId}`).setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(async () => {
                        await logChannel.send(`🚨 **AUTOMOD LOG (Fallback)** 🚨\nUser: <@${message.author.id}>\nReason: ${reason}\nCase: ${caseId}\nContent: ${safeContent}`);
                    });
                } catch (error) { console.error("Gagal mengirim log:", error); }
            };

            const hasAdminPerm = message.member?.permissions?.has(PermissionFlagsBits.ManageMessages) || false;

            if (!isCommand && badWords.length > 0) {
                const safeWords = badWords.map(w => w.trim().toLowerCase()).filter(w => w !== '');
                const hasBadWord = safeWords.some(word => contentLower.includes(word));
                if (hasBadWord) {
                    isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Triggered Word Filter', contentRaw);
                    message.channel.send(`⚠️ <@${message.author.id}>, Please, mind your language!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
                }
            }

            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+)/gi;
            if (!isViolating && !isCommand && !isLinkAllowedChannel && linkRegex.test(contentLower) && !hasAdminPerm) {
                isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Posted a Link', contentRaw);
                message.channel.send(`🔗 <@${message.author.id}>, sending links is not allowed in this channel!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
            }

            if (!isViolating && !isCommand && contentRaw.length > 15 && !hasAdminPerm) {
                const capsCount = contentRaw.replace(/[^A-Z]/g, '').length;
                if ((capsCount / contentRaw.length) * 100 > 70) {
                    isViolating = true; message.delete().catch(()=>{}); sendAutoModLog('Excessive Caps Lock', contentRaw);
                    message.channel.send(`🔠 <@${message.author.id}>, please turn off your Caps Lock!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
                }
            }

            if (isViolating) return;

            let afkData = {};
            try { afkData = JSON.parse(fs.readFileSync(client.AFK_FILE, 'utf8')); } catch (e) {}
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

            if (afkChanged) fs.writeFileSync(client.AFK_FILE, JSON.stringify(afkData, null, 2));

            if (!contentLower.startsWith(client.PREFIX.toLowerCase())) return;
            const args = contentRaw.slice(client.PREFIX.length).trim().split(/\s+/);
            if (args.length === 0) return;

            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);
            if (!command) return;

            const isRealAdmin = message.member?.permissions?.has(PermissionFlagsBits.ManageGuild) || false;
            const isCustomAdmin = settings[guildId].authorizedUsers.includes(message.author.id);

            message.reply = (content) => message.channel.send(content);
            try { await command.executePrefix(message, args, client.SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin); }
            catch (error) { console.error(error); }

        } catch (error) { console.error("Critical Message Event Error:", error); }
    },
};
