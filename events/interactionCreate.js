const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        
        // --- 🔥 ANTI-CRASH: BLOKIR DIRECT MESSAGE (DM) 🔥 ---
        if (!interaction.guild) {
            // Jika interaksi bisa dibalas (seperti slash command), kirim peringatan
            if (interaction.isRepliable()) {
                return interaction.reply({ 
                    content: '❌ **Access Denied:** Bot commands and interactions can only be used inside the Outpost server!', 
                    ephemeral: true 
                }).catch(() => {});
            }
            return; // Hentikan proses secara total
        }
        
        // ==========================================
        // --- CHARM GIFTING SYSTEM (3 RANTAI REAKSI) ---
        // ==========================================
        
        // REAKSI 1: Tangkap klik tombol "Charm" -> Munculkan Dropdown
        if (interaction.isButton() && interaction.customId.startsWith('charm_profile_')) {
            const targetId = interaction.customId.split('_')[2];
            
            const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
            const giftMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_gift_${targetId}`)
                .setPlaceholder('Select an item to gift...')
                .addOptions([
                    { label: 'Rose', description: '+250 Charisma', value: 'rose', emoji: '1510280805383934072' },
                    { label: 'Cake', description: '+500 Charisma', value: 'cake', emoji: '1510283539470483636' },
                    { label: 'Box', description: '+1000 Charisma', value: 'box', emoji: '1510283431802704022' },
                    { label: 'Treasure Maps', description: '+1500 Charisma', value: 'treasure', emoji: '1510283600837349446' },
                    { label: 'Coins', description: '+2000 Charisma', value: 'coins', emoji: '1510283704021418185' }
                ]);

            const row = new ActionRowBuilder().addComponents(giftMenu);
            return interaction.reply({ content: '🎁 **Select an item from your inventory to give:**', components: [row], ephemeral: true });
        }

        // REAKSI 2: Tangkap pilihan Menu Dropdown -> Munculkan Formulir Jumlah
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_gift_')) {
            const targetId = interaction.customId.split('_')[2];
            const selectedItem = interaction.values[0];
            
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            const modal = new ModalBuilder()
                .setCustomId(`modalgift_${selectedItem}_${targetId}`)
                .setTitle('Send Gift');

            const qtyInput = new TextInputBuilder()
                .setCustomId('gift_qty')
                .setLabel('How many do you want to send?')
                .setPlaceholder('Example: 1, 5, 10...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(qtyInput));
            return interaction.showModal(modal);
        }

        // REAKSI 3: Tangkap Formulir Jumlah -> Potong Saldo & Tambah Karisma
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modalgift_')) {
            const parts = interaction.customId.split('_');
            const itemId = parts[1];
            const targetId = parts[2];
            const senderId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            const qtyStr = interaction.fields.getTextInputValue('gift_qty');
            const qty = parseInt(qtyStr);
            
            if (isNaN(qty) || qty <= 0) {
                return interaction.reply({ content: '❌ Please enter a valid number greater than 0.', ephemeral: true });
            }

            // 🚀 PERBARUAN: TARIK DATA DARI IN-MEMORY CACHE
            const senderProfile = client.getProfile(guildId, senderId);
            
            // Verifikasi Inventory Pengirim
            if (!senderProfile.inventory || (senderProfile.inventory[itemId] || 0) < qty) {
                return interaction.reply({ content: `❌ You don't have enough **${itemId}** in your inventory!`, ephemeral: true });
            }

            // Hitung Karisma yang Didapatkan
            const charismaValues = { 'rose': 250, 'cake': 500, 'box': 1000, 'treasure': 1500, 'coins': 2000 };
            const addedCharisma = charismaValues[itemId] * qty;

            // Kurangi saldo dari pengirim
            senderProfile.inventory[itemId] -= qty;
            
            // Tambahkan karisma ke target
            const targetProfile = client.getProfile(guildId, targetId);
            targetProfile.charisma += addedCharisma;
            
            // 🚀 PERBARUAN: SIMPAN PERUBAHAN DI BACKGROUND SECARA ASINKRON
            client.saveProfile();

            return interaction.reply({ content: `✅ **Success!** You gifted **${qty}x ${itemId}** to <@${targetId}>.\n✨ Their Charisma increased by **${addedCharisma}**!`, ephemeral: true });
        }
        // ==========================================

        // --- CLAN SELECTION MENU SYSTEM ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_clan') {
            const selectedClan = interaction.values[0];
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // 🚀 PERBARUAN: TARIK DATA DARI IN-MEMORY CACHE
            const userData = client.getProfile(guildId, userId);

            // Terapkan perubahan dan simpan
            userData.clan = selectedClan;
            client.saveProfile();

            const currentLevel = userData.level || 1;
            const currentXP = userData.xp || 0;
            const requiredXP = currentLevel * currentLevel * 100;
            const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
            const xpInCurrentLevel = currentXP - previousLevelXP;
            const xpNeededForLevelUp = requiredXP - previousLevelXP;
            
            const size = 15;
            const progress = Math.round((xpInCurrentLevel / xpNeededForLevelUp) * size);
            const safeProgress = Math.min(Math.max(progress, 0), size);
            const progressBar = `[${'■'.repeat(safeProgress)}${'□'.repeat(size - safeProgress)}]`;
            
            const divider = '─────────────────────';
            let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
            if (userData.badges && userData.badges.length > 0) {
                desc += `${userData.badges.join(' ')}\n${divider}\n`;
            }
            desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;

            const userTag = userData.gamertag || '*Not set*';
            const clanTag = userData.clan || '*Not set*';
            const likesCount = userData.likes ? userData.likes.length : 0;
            const charismaCount = userData.charisma || 0;

            desc += `**USER INFO:**\n`;
            desc += `<:user:1509262449394716803> ${userTag}\n`;
            desc += `<:clan:1509262421423034549> ${clanTag}\n\n`;
            desc += `<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**`;
            
            const targetUserObj = interaction.user;
            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setAuthor({ name: `${targetUserObj.username}'s Profile`, iconURL: targetUserObj.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(targetUserObj.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(desc);
                
            if (userData.album) embed.setImage(userData.album);
            
            await interaction.update({ embeds: [embed] });
            await interaction.followUp({ content: `✅ Successfully joined the **${selectedClan}** clan!`, ephemeral: true });
            return;
        }
        
        // --- BUTTON LIKES SYSTEM (PROFILE) ---
        if (interaction.isButton() && interaction.customId.startsWith('like_profile_')) {
            const targetId = interaction.customId.split('_')[2];
            const likerId = interaction.user.id;
            const guildId = interaction.guild.id;

            if (targetId === likerId) {
                return interaction.reply({ content: '❌ You cannot like your own profile!', ephemeral: true });
            }

            // 🚀 PERBARUAN: TARIK DATA DARI IN-MEMORY CACHE
            const userData = client.getProfile(guildId, targetId);
            
            const likedIndex = userData.likes.indexOf(likerId);
            let responseText = '';
            
            if (likedIndex > -1) {
                userData.likes.splice(likedIndex, 1);
                responseText = '⚠️ You removed your like from this profile.';
            } else {
                userData.likes.push(likerId);
                responseText = '✅ You liked this player\'s profile!';
            }
            
            // 🚀 PERBARUAN: SIMPAN PERUBAHAN DI BACKGROUND
            client.saveProfile();
            
            // Render ulang embed profil secara Real-Time dengan format menyamping
            const currentLevel = userData.level || 1;
            const currentXP = userData.xp || 0;
            const requiredXP = currentLevel * currentLevel * 100;
            const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
            const xpInCurrentLevel = currentXP - previousLevelXP;
            const xpNeededForLevelUp = requiredXP - previousLevelXP;
            
            const size = 15;
            const progress = Math.round((xpInCurrentLevel / xpNeededForLevelUp) * size);
            const safeProgress = Math.min(Math.max(progress, 0), size);
            const progressBar = `[${'■'.repeat(safeProgress)}${'□'.repeat(size - safeProgress)}]`;
            
            const divider = '─────────────────────';
            let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
            if (userData.badges && userData.badges.length > 0) {
                desc += `${userData.badges.join(' ')}\n${divider}\n`;
            }
            
            desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;

            const userTag = userData.gamertag || '*Not set*';
            const clanTag = userData.clan || '*Not set*';
            const likesCount = userData.likes.length;
            const charismaCount = userData.charisma || 0;

            desc += `**USER INFO:**\n`;
            desc += `<:user:1509262449394716803> ${userTag}\n`;
            desc += `<:clan:1509262421423034549> ${clanTag}\n\n`;
            desc += `<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**`;
            
            const targetUserObj = await interaction.client.users.fetch(targetId).catch(() => null);
            if (targetUserObj) {
                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setAuthor({ name: `${targetUserObj.username}'s Profile`, iconURL: targetUserObj.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(targetUserObj.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setDescription(desc);
                    
                if (userData.album) embed.setImage(userData.album);
                
                await interaction.update({ embeds: [embed] });
                await interaction.followUp({ content: responseText, ephemeral: true });
            } else {
                await interaction.reply({ content: responseText, ephemeral: true });
            }
            return;
        }

        // ==========================================
        // --- BIO DROPDOWN MENU SYSTEM ---
        // ==========================================
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_bio_menu') {
            const selection = interaction.values[0];
            if (selection === 'edit_bio') {
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                
                const modal = new ModalBuilder()
                    .setCustomId('modal_bio_input')
                    .setTitle('Edit Profile Bio');

                const bioInput = new TextInputBuilder()
                    .setCustomId('bio_text')
                    .setLabel('Write your bio here:')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Hello, I am a Pioneer Explorer...')
                    .setMaxLength(300) // Batas maksimal aman untuk Discord embed
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(bioInput));
                await interaction.showModal(modal);
            }
            return;
        }

        // --- TANGKAP HASIL FORM (MODAL) BIO ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_bio_input') {
            const bioText = interaction.fields.getTextInputValue('bio_text');
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // 🚀 1. TARIK DATA LANGSUNG DARI MESIN RAM
            const userData = client.getProfile(guildId, userId);
        
            // 🔥 2. LAPISAN PELINDUNG (Cegah Glitch Teks "null")
            // Jika bot gagal membaca teks, otomatis diisi 'Not set.'
            userData.bio = bioText ? bioText : 'Not set.'; 
        
            // 3. SIMPAN KE RAM
            client.saveProfile();

            // 2. Render ulang embed profil secara Real-Time dengan tampilan Bio code block
            const currentLevel = userData.level || 1;
            const currentXP = userData.xp || 0;
            const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
            const requiredXP = currentLevel * currentLevel * 100;
            const xpInCurrentLevel = currentXP - previousLevelXP;
            const xpNeededForLevelUp = requiredXP - previousLevelXP;
            
            const size = 15;
            const progress = Math.round((xpInCurrentLevel / xpNeededForLevelUp) * size);
            const safeProgress = Math.min(Math.max(progress, 0), size);
            const progressBar = `[${'■'.repeat(safeProgress)}${'□'.repeat(size - safeProgress)}]`;
            
            const divider = '─────────────────────';
            let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
            if (userData.badges && userData.badges.length > 0) desc += `${userData.badges.join(' ')}\n${divider}\n`;
            
            desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;

            const userTag = userData.gamertag || '*Not set*';
            const clanTag = userData.clan || '*Not set*';
            const likesCount = userData.likes ? userData.likes.length : 0;
            const charismaCount = userData.charisma || 0;

            desc += `**USER INFO:**\n`;
            desc += `<:user:1509262449394716803> ${userTag}\n`;
            desc += `<:clan:1509262421423034549> ${clanTag}\n\n`;
            desc += `<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**\n\n`;
            
            // 🔥 TAMPILKAN BIO BARU 🔥
            desc += `${divider}\n`;
            desc += `**BIO:**\n\`\`\`text\n${userData.bio}\n\`\`\``;

            const targetUserObj = interaction.user;
            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setAuthor({ name: `${targetUserObj.username}'s Profile`, iconURL: targetUserObj.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(targetUserObj.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(desc);

            if (userData.album) embed.setImage(userData.album);

            // Update pesan aslinya secara instan
            if (interaction.message) {
                await interaction.update({ embeds: [embed] }).catch(()=>{});
            } else {
                await interaction.reply({ content: '✅ Bio successfully updated!', ephemeral: true });
            }
            return;
        }
        // ==========================================

        // --- ROLE MENU SYSTEM ---
        if (interaction.isStringSelectMenu() && (interaction.customId === 'server_roles_menu' || interaction.customId === 'language_roles_menu')) {
            await interaction.deferReply({ ephemeral: true });
            try {
                const actionRow = interaction.message.components.find(row => row.components[0].customId === interaction.customId);
                
                // 1. Ambil kata kunci dari menu (contoh: 'role_announcements', 'role_id')
                const availableKeys = actionRow.components[0].options.map(opt => opt.value);
                const selectedKeys = interaction.values;
                const member = interaction.member;

                // 2. Buka database server (sudah menggunakan In-Memory Cache)
                const settings = interaction.client.checkDatabase(interaction.guild.id) || {};

                // 3. MESIN PENERJEMAH: Ubah kata kunci teks menjadi ID Role angka asli
                const allAvailableIds = availableKeys.map(key => settings[key]).filter(id => id);
                const selectedIds = selectedKeys.map(key => settings[key]).filter(id => id);

                // 4. Logika penghapusan dan penambahan role
                const rolesToRemove = allAvailableIds.filter(id => !selectedIds.includes(id) && member.roles.cache.has(id));
                if (rolesToRemove.length > 0) await member.roles.remove(rolesToRemove);

                const rolesToAdd = selectedIds.filter(id => !member.roles.cache.has(id));
                if (rolesToAdd.length > 0) await member.roles.add(rolesToAdd);

                await interaction.editReply({ content: '✅ **Roles updated successfully!** Your profile has been synchronized.' });
            } catch (error) { 
                console.error("Role Menu Error:", error);
                await interaction.editReply({ content: '❌ **Failed to update roles!** Please contact an Outpost Commander.' }); 
            }
            return;
        }

        // --- VERIFICATION SYSTEM (CAPTCHA) ---
        if (interaction.isButton() && interaction.customId === 'verify_button') {
            const member = interaction.member;
            const guild = interaction.guild;
            try {
                const existingChannel = guild.channels.cache.find(c => c.topic === member.id && c.name.startsWith('verify-'));
                if (existingChannel) await existingChannel.delete().catch(() => {});
                const verifyChannel = await guild.channels.create({
                    name: `verify-${member.user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
                    type: ChannelType.GuildText,
                    topic: member.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
                    ]
                });
                await interaction.reply({ content: `✅ Security verification deployed! Head over to ${verifyChannel}`, ephemeral: true });
                if (!client.captchaCodes) client.captchaCodes = new Map();
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let code = '';
                for (let i = 0; i < 6; i++) code += characters.charAt(Math.floor(Math.random() * characters.length));
                client.captchaCodes.set(member.id, code);
                const imageUrl = `https://dummyimage.com/300x100/2F3136/ffffff.png&text=${code}`;
                const embed = new EmbedBuilder().setColor('#2F3136').setTitle('🛡️ SECURITY VERIFICATION').setDescription(`Welcome <@${member.id}>!\n\nTo prove you are human and gain full access to the outpost, please type the **6-character code** shown in the image below.\n\n-# Note: The code is case-sensitive`).setImage(imageUrl);
                await verifyChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
            } catch (err) { await interaction.reply({ content: '❌ Failed to create verification channel!', ephemeral: true }); }
            return;
        }

        // --- TICKET SYSTEM ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
            const reason = interaction.values[0];
            const member = interaction.member;
            const guild = interaction.guild;
            
            // --- 🔥 ANTI-SPAM: DUPLICATE TICKET CHECK 🔥 ---
            const cleanUsername = member.user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const existingTicket = guild.channels.cache.find(c => 
                c.name === `ticket-${cleanUsername}`
            );

            if (existingTicket) {
                return interaction.reply({ 
                    content: `❌ **Access Denied:** You already have an active ticket open here: <#${existingTicket.id}>. Please resolve it first!`, 
                    ephemeral: true 
                });
            }
            // ------------------------------------------------
            
            try {
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${cleanUsername}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
                    ]
                });
                await interaction.reply({ content: `✅ Signal received! Head over to your private channel: ${ticketChannel}`, ephemeral: true });
                const ticketEmbed = new EmbedBuilder().setColor('#2F3136').setTitle('🏕️ DISTRESS SIGNAL OPENED').setDescription(`Welcome to your private channel, <@${member.id}>.\n\n**Category:** ${reason.toUpperCase()}\n\nPlease describe your issue clearly and provide any evidence/screenshots if needed. An Outpost Commander will be with you shortly.`).setFooter({ text: 'Press the lock button below to close this ticket.' });
                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket & Save Log').setStyle(ButtonStyle.Danger).setEmoji('🔒');
                await ticketChannel.send({ content: `<@${member.id}>`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
            } catch (error) { await interaction.reply({ content: '❌ Failed to deploy ticket channel!', ephemeral: true }); }
            return;
        }

        if (interaction.isButton() && interaction.customId === 'close_ticket') {
            try {
                // 🚀 PERBARUAN: Waktu hitung mundur diubah menjadi 5 detik
                await interaction.reply('🔒 Securing data logs and dismantling channel in 5 seconds...');
                const channel = interaction.channel;
                const guildId = interaction.guild.id;
                const settings = client.checkDatabase(guildId);
                const logChannelId = settings[guildId]?.logChannelId;
                const messages = await channel.messages.fetch({ limit: 100 });
                const transcriptArray = Array.from(messages.values()).reverse().map(m => {
                    const d = new Date(m.createdTimestamp);
                    const safeDate = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
                    return `[${safeDate}] ${m.author.tag}: ${m.content} ${m.attachments.size > 0 ? '(Attachment Included)' : ''}`;
                });
                const transcriptText = transcriptArray.join('\n');
                const buffer = Buffer.from(transcriptText, 'utf8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-log.txt` });
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const embedLog = new EmbedBuilder().setColor('#2F3136').setTitle('🎫 TICKET CLOSED & LOGGED').setDescription(`**Ticket:** ${channel.name}\n**Closed By:** <@${interaction.user.id}>`).setTimestamp();
                        await logChannel.send({ embeds: [embedLog], files: [attachment] });
                    }
                }
                // 🚀 PERBARUAN: Waktu eksekusi penghapusan diubah menjadi 5000ms (5 detik)
                setTimeout(() => { channel.delete().catch(console.error); }, 5000);
            } catch (err) { await interaction.followUp({ content: '❌ Error closing ticket.', ephemeral: true }).catch(()=>{}); }
            return;
        }

        // --- SUGGESTION SYSTEM ---
        if (interaction.isButton() && interaction.customId === 'create_suggestion') {
            const modal = new ModalBuilder().setCustomId('suggestion_modal').setTitle('Submit a Suggestion');
            const suggestionInput = new TextInputBuilder().setCustomId('suggestion_text').setLabel("What is your idea?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
            modal.addComponents(new ActionRowBuilder().addComponents(suggestionInput));
            await interaction.showModal(modal);
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === 'suggestion_modal') {
            const suggestionText = interaction.fields.getTextInputValue('suggestion_text');
            const guildId = interaction.guild.id;
            const settings = client.checkDatabase(guildId);
            const targetChannelId = settings.suggestionChannelId;
            const targetChannel = targetChannelId ? interaction.guild.channels.cache.get(targetChannelId) : interaction.channel;
            if (!targetChannel) return interaction.reply({ content: '❌ Target channel error!', ephemeral: true });
            const suggestionEmbed = new EmbedBuilder().setColor('#FEE75C').setAuthor({ name: `${interaction.user.tag} suggests:`, iconURL: interaction.user.displayAvatarURL() }).setDescription(`**Suggestion:**\n${suggestionText}`).setTimestamp().setFooter({ text: 'Vote below! ⬆️ for Yes, ⬇️ for No' });
            try {
            // 1. JAWAB DISCORD DULUAN AGAR TIDAK ERROR MERAH (Timeout 3 detik)
            await interaction.reply({ content: `✅ Your suggestion has been sent to ${targetChannel}!`, ephemeral: true });

            // 2. BARU LAKUKAN PEKERJAAN BERAT DI BELAKANG LAYAR
            const suggestionMsg = await targetChannel.send({ embeds: [suggestionEmbed] });
            await suggestionMsg.react('⬆️'); 
            await suggestionMsg.react('⬇️');
            
            if (interaction.message) await interaction.message.delete().catch(() => {});
            
            const panelEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('💡 PIONEER IDEAS & SUGGESTIONS')
                .setDescription('Have a thought that could make **Pioneer Outpost Nusa** even greater? Share it with the community!\n\n• Click the button below to submit your suggestion.\n• The community can vote using ⬆️ and ⬇️ reactions.\n• Highly voted ideas will be reviewed and possibly implemented by the Outpost Commanders.\n\n*Help us build a better world!*')
                .setImage('https://i.imgur.com/OfQFrmQ.png');
                
            const btn = new ButtonBuilder()
                .setCustomId('create_suggestion')
                .setLabel('CREATE SUGGESTION')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝');
                
            await interaction.channel.send({ embeds: [panelEmbed], components: [new ActionRowBuilder().addComponents(btn)] });

        } catch (error) { 
            // Jika ada error fatal, beri tahu (jika belum di-reply)
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Failed to submit suggestion.', ephemeral: true }).catch(()=>{});
            }
        }
            
        return; // <--- 🔥 TAMBAHKAN INI (Hanya jika belum ada)
    } // <--- 🔥 TAMBAHKAN INI JUGA (Ini 

        // --- HELP MENU DROPDOWN ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
            const selection = interaction.values[0];
            const embed = new EmbedBuilder().setTimestamp();
            const p = client.PREFIX;
            const emojisPath = path.join(__dirname, '../emojis.json');
            let emojis = { help_main: '🏕️', help_general: '🧭', help_profile: '🏅', help_management: '🧱', help_support: '🛠️', help_moderation: '🛡️' };
            if (fs.existsSync(emojisPath)) {
                try {
                    const parsedEmojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
                    emojis = { ...emojis, ...parsedEmojis };
                } catch (e) {}
            }
            const getEmoji = (emojiStr, fallback) => {
                if (!emojiStr) return fallback;
                const match = String(emojiStr).match(/\d+/);
                if (match && interaction.guild) {
                    const guildEmoji = interaction.guild.emojis.cache.get(match[0]);
                    if (guildEmoji) return guildEmoji.toString();
                }
                return emojiStr;
            };

            switch (selection) {
                case 'help_main':
                    embed.setColor('#2F3136').setTitle('🏕️ PIONEER OUTPOST HELP PANEL').setDescription('Welcome Explorer! Select a category from the dropdown menu below to view available commands and server configurations.').addFields(
                        { name: `${getEmoji(emojis.help_general, '🧭')} General`, value: 'Basic bot interactions, user utilities, and AFK systems.', inline: true },
                        { name: `${getEmoji(emojis.help_profile, '🏅')} Progress`, value: 'View player statistics, titles, badges, and customize your ID.', inline: true },
                        { name: `${getEmoji(emojis.help_management, '🧱')} Ch Management & Welcome`, value: 'Tools for channel, role, locks, custom greetings, logs, and suggestions.', inline: true },
                        { name: `${getEmoji(emojis.help_moderation, '🛡️')} Moderation`, value: 'Word filters and auto-moderation tools.', inline: true },
                        { name: `${getEmoji(emojis.help_support, '🛠️')} Support & Utilities`, value: 'Configure custom bot access and administrator rights.', inline: true }
                    ).setFooter({ text: 'Pioneer Support • Choose a category below' });
                    break;
                case 'help_moderation':
                    embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_moderation, '🛡️')} MODERATION PANEL`).setDescription('Tools to keep your outpost safe and clean from violations:').addFields(
                        { name: '📝 Word Filter System', value: `\`${p} word add [word]\` - Add a word to the filter list.\n\`${p} word rmv [word]\` - Remove a word from the filter.\n\`${p} word list\` - View all filtered words.` },
                        { name: '🔗 Link Control System', value: `\`${p} antiinvite [on/off]\` - Toggle Discord invite blocker.\n\`${p} link allow [#channel]\` - Allow links in a channel.\n\`${p} link block [#channel]\` - Block links back.\n\`${p} link list\` - View allowed link channels.` },
                        { name: '🔨 Action Commands', value: `\`${p} warn / unwarn [@user]\` - Add/remove warning\n\`${p} clearwarn [@user]\` - Reset warns (0/3)\n\`${p} history [@user]\` - Lookup moderation history\n\`${p} purge [@user/links] [amount]\` - Advanced purge chat\n\`${p} mute / unmute [@user]\` - Mute/unmute player\n\`${p} kick [@user] [reason]\` - Kick player\n\`${p} ban / tempban [@user] [reason]\` - Ban / Tempban player\n\`${p} unban [user_id]\` - Unban player by ID\n\`${p} set mute [@role]\` - Set restricted role` }
                    ).setFooter({ text: 'Category: Moderation (Admin Only)' });
                    break;
                case 'help_general':
                    embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_general, '🧭')} GENERAL BOT COMMANDS`).setDescription('Here are the basic commands available for all members:').addFields(
                        { name: `\`${p} afk [reason]\``, value: 'Set your status to Away From Keyboard (AFK).' },
                        { name: `\`${p} info\``, value: 'View bot statistics, current ping, and system uptime.' },
                        { name: `\`${p} avatar [user]\``, value: 'Display your own or another member\'s high-resolution avatar.' },
                        { name: `\`${p} vote\``, value: 'Support our outpost by voting for the bot on community lists.' },
                        { name: `\`${p} dog / cat\``, value: 'Summon a random cute dog or cat image.' },
                        { name: `\`${p} meme\``, value: 'Get a random fresh meme from Reddit.' }
                    ).setFooter({ text: 'Category: General Commands' });
                    break;
                case 'help_profile':
                    embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_profile, '🏅')} PLAYER PROGRESS SYSTEM`)
                    .setDescription('Manage your RPG identity, check your levels, and customize your ID card:')
                    .addFields(
                        { name: '📊 Progression & Stats', value: `\`${p} profile [@user]\` - View your RPG Profile card (Level, EXP, Badges).` },
                        { name: '🔰 Identity & Customization', value: `\`${p} gamertag [name]\` - Set your in-game name.\n\`${p} clan\` - Set your in-game clan.\n\`${p} album\` - Set a custom image (attach an image).\n\`${p} delalbum\` - Remove your custom profile image.` }
                    )
                    .setFooter({ text: 'Category: Progress & Ranks' });
                    break;
                case 'help_management':
                    embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_management, '🧱')} CH MANAGEMENT & WELCOME SETUP`).setDescription('Configuration commands to control, structure channels, setup greetings, and logs:').addFields(
                        { name: '🧱 Channel & Role Management', value: `\`${p} crt cha [name]\` - Create text channel.\n\`${p} crt cat [name]\` - Create category folder.\n\`${p} crt role [hex] [name]\` - Create custom colored role.\n\`${p} rmv [cha/cat/role]\` - Delete channel/category/role.\n\`${p} rmv msg [amount]\` - Clear chat messages.\n\`${p} lock / unlock [channel]\` - Toggle channel locks.\n\`${p} slowmode [channel] [seconds]\` - Set slowmode cooldown.` },
                        { name: '👋 Welcome Greeting Configurations', value: `\`${p} set wcm [#channel]\` - Set target welcome channel.\n\`${p} wcm gif [imgur_link]\` - Pool custom background Imgur GIF.\n\`${p} wcm list\` - View registered welcome GIFs.\n\`${p} wcm rmv [num]\` - Remove custom GIF from database.` },
                        { name: '📝 Ticket & Suggestion Logs', value: `\`${p} set log [#channel]\` - Set archive log channel for closed tickets.\n\`${p} set sug [#channel]\` - Set community suggestion channel.\n\`${p} suggestion\` - Deploy Suggestion Embed Panel.\n\`${p} set mod [#channel]\` - Set moderation log channel.` },
                        { name: '🛡️ Security & Role Panels', value: `\`${p} verifysetup [@unv] [@ver] [#channel]\` - Deploy CAPTCHA gate.\n\`${p} rolesetup [#channel]\` - Deploy Auto-Role Menu Panel.\n\`${p} setrole [category] [@role]\` - Link a database role for panels.\n\`${p} fixverify [@unv] [@ver]\` - Sync roles for old members.` },
                        { name: '📢 Announcement System', value: `\`${p} announce [#channel] [title] | [msg] | [@ping]\` - Send official news.\n\`${p} schedule [time] [#channel] [title] | [msg] | [@ping]\` - Delay publish (10m, 1h, 1d).` }
                    ).setFooter({ text: 'Category: Management & Welcome (Admin Only)' });
                    break;
                case 'help_support':
                    embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_support, '🛠️')} SUPPORT & UTILITIES PANEL`).setDescription('Core configuration tools for advanced bot access modules:').addFields(
                        { name: `\`${p} access add / rmv [@user]\``, value: 'Grant or revoke custom admin permissions to run bot commands.' },
                        { name: `\`${p} access list\``, value: 'Display all authorized custom bot administrators.' },
                        { name: '📌 Help Panel Shortcuts', value: `\`${p} help gen\` - Open General panel\n\`${p} help pro\` - Open Progress panel\n\`${p} help cha\` - Open Management panel\n\`${p} help mod\` - Open Moderation panel\n\`${p} help sup\` - Open Support panel` }
                    ).setFooter({ text: 'Category: Support & Utilities (Admin Only)' });
                    break;
            }
            await interaction.update({ embeds: [embed] }).catch(()=>{});
            return;
        }

        // --- COMMAND EXECUTION ---
        if (!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        const cmdSettings = client.checkDatabase(interaction.guild.id) || {};
        const isRealAdmin = interaction.member ? interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) : false;
        const isCustomAdmin = cmdSettings.authorizedUsers ? cmdSettings.authorizedUsers.includes(interaction.user.id) : false;

        // 🔥 GLOBAL FIREWALL (PREVENT REGULAR PLAYERS FROM USING ADMIN COMMANDS) 🔥
        const adminCommands = [
            'kick', 'ban', 'tempban', 'unban', 'warn', 'unwarn', 'clearwarn', 'history', 'purge', 
            'mute', 'unmute', 'crt', 'rmv', 'set', 'wcm', 'access', 'lock', 'unlock', 'slowmode', 
            'suggestion', 'rolesetup', 'setrole', 'verifysetup', 'announce', 'schedule', 'fixverify', 'antiinvite', 'word', 'link'
        ];

        // If the triggered command is in the admin list, check their credentials!
        if (adminCommands.includes(command.name)) {
            if (!isRealAdmin && !isCustomAdmin) {
                return interaction.reply({ 
                    content: '❌ **Access Denied:** You do not have the Outpost Commander authority to use this command!', 
                    ephemeral: true 
                });
            }
        }

        // 🎩 HACKER ILLUSION: Give Custom Admins a 'Fake VIP Card' to bypass old locks inside command files
        let execInteraction = interaction;
        if (isCustomAdmin && interaction.member) {
            execInteraction = new Proxy(interaction, {
                get: (target, prop) => {
                    if (prop === 'member') {
                        return new Proxy(target.member, {
                            get: (mTarget, mProp) => {
                                // If the old file asks for permissions, blindly answer YES!
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
            await command.executeSlash(execInteraction, client.SETTINGS_FILE, cmdSettings, isRealAdmin, isCustomAdmin); 
        } catch (error) { 
            console.error(error); 
        }
    },
};