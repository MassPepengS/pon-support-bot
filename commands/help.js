const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🔍 RADAR AKSES: Sesuaikan nama file ini jika database 'pon access' Anda bernama lain
const accessFile = path.join(__dirname, '../access.json');

function checkIsAdmin(member) {
    if (!member) return false;
    // 1. Cek izin Administrator bawaan Discord
    if (member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    
    // 2. Cek database 'pon access'
    if (fs.existsSync(accessFile)) {
        try {
            const accessDB = JSON.parse(fs.readFileSync(accessFile, 'utf8'));
            if (accessDB[member.id]) return true;
        } catch (error) {
            console.log('⚠️ [WARNING] Gagal membaca access.json');
        }
    }
    return false;
}

module.exports = {
    name: 'help',
    description: 'Show the bot command list',

    // ==========================================
    // DATA UNTUK DISCORD SLASH COMMAND API
    // ==========================================
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show the bot command list')
        .addStringOption(option => option.setName('category').setDescription('Directly open a specific category').setRequired(false)
            .addChoices(
                { name: 'General', value: 'gen' }, 
                { name: 'Progress', value: 'pro' }, 
                { name: 'Management', value: 'cha' }, 
                { name: 'Moderation', value: 'mod' }, 
                { name: 'Support', value: 'sup' }
            )),

    // ==========================================
    // 1. PREFIX COMMAND (pon help ...)
    // ==========================================
    async executePrefix(message, args) {
        const p = 'pon';
        const sub = args[0] ? args[0].toLowerCase() : null;
        const isAdmin = checkIsAdmin(message.member);

        const emojisPath = path.join(__dirname, '../emojis.json');
        let emojis = { help_main: '🏕️', help_general: '🧭', help_profile: '👤', help_management: '🧱', help_support: '🛠️', help_moderation: '🛡️' };
        
        // SISTEM PERISAI
        if (fs.existsSync(emojisPath)) {
            try {
                const parsedEmojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
                emojis = { ...emojis, ...parsedEmojis };
            } catch (error) {
                console.log('⚠️ [WARNING] File emojis.json formatnya rusak.');
            }
        }

        const getEmoji = (emojiStr, fallback) => {
            if (!emojiStr) return fallback;
            const match = String(emojiStr).match(/\d+/);
            if (match && message.guild) {
                const guildEmoji = message.guild.emojis.cache.get(match[0]);
                if (guildEmoji) return guildEmoji.toString();
            }
            return emojiStr;
        };

        const embed = new EmbedBuilder().setTimestamp();

        // --- SUB CATEGORIES ---
        if (sub === 'gen' || sub === 'general') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_general, '🧭')} GENERAL BOT COMMANDS`).setDescription('Here are the basic commands available for all server members:').addFields({ name: `\`${p} afk [reason]\``, value: 'Set your status to Away From Keyboard (AFK).' },{ name: `\`${p} info\``, value: 'View bot statistics, current ping, and system uptime.' },{ name: `\`${p} avatar [user]\``, value: 'Display your own or another member\'s high-resolution avatar.' },{ name: `\`${p} vote\``, value: 'Support our outpost by voting for the bot on community lists.' },{ name: `\`${p} dog / cat\``, value: 'Summon a random cute dog or cat image.' },{ name: `\`${p} meme\``, value: 'Get a random fresh meme from Reddit.' }).setFooter({ text: 'Category: General Commands' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'pro' || sub === 'profile' || sub === 'progress') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_profile, '🏅')} PLAYER PROGRESS SYSTEM`)
            .setDescription('Manage your RPG identity, check your levels, and customize your ID card:')
            .addFields(
                { name: '📊 Progression & Stats', value: `\`${p} profile [@user]\` - View your RPG Profile card (Level, EXP, Badges).` },
                { name: '🔰 Identity & Customization', value: `\`${p} gamertag [name]\` - Set your in-game name.\n\`${p} clan\` - Set your in-game clan.\n\`${p} album\` - Set a custom image (attach an image).\n\`${p} delalbum\` - Remove your custom profile image.` }
            )
            .setFooter({ text: 'Category: Progress & Ranks' });
            return message.reply({ embeds: [embed] });
        }

        // BLOKIR AKSES PLAYER KE MENU ADMIN
        if (sub === 'cha' || sub === 'management' || sub === 'mod' || sub === 'moderation' || sub === 'sup' || sub === 'support') {
            if (!isAdmin) return message.reply('❌ **Access Denied:** You do not have permission to view Admin configurations.');
        }

        if (sub === 'cha' || sub === 'management') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_management, '🧱')} CH MANAGEMENT & WELCOME SETUP`).setDescription('Configuration commands to control, structure channels, setup greetings, and logs:').addFields(
                { name: '🧱 Channel & Role Management', value: `\`${p} crt cha [name]\` - Create text channel.\n\`${p} crt cat [name]\` - Create category folder.\n\`${p} crt role [hex] [name]\` - Create custom colored role.\n\`${p} rmv [cha/cat/role]\` - Delete channel/category/role.\n\`${p} rmv msg [amount]\` - Clear chat messages.\n\`${p} lock / unlock [channel]\` - Toggle channel locks.\n\`${p} slowmode [channel] [seconds]\` - Set slowmode cooldown.` },
                { name: '👋 Welcome Greeting Configurations', value: `\`${p} set wcm [#channel]\` - Set target welcome channel.\n\`${p} wcm gif [imgur_link]\` - Pool custom background Imgur GIF.\n\`${p} wcm list\` - View registered welcome GIFs.\n\`${p} wcm rmv [num]\` - Remove custom GIF from database.` },
                { name: '📝 Ticket & Suggestion Logs', value: `\`${p} set log [#channel]\` - Set archive log channel for closed tickets.\n\`${p} set sug [#channel]\` - Set community suggestion channel.\n\`${p} suggestion\` - Deploy Suggestion Embed Panel.\n\`${p} set mod [#channel]\` - Set moderation log channel.` },
                { name: '🛡️ Security & Role Panels', value: `\`${p} verifysetup [@unv] [@ver] [#channel]\` - Deploy CAPTCHA gate.\n\`${p} rolesetup [#channel]\` - Deploy Auto-Role Menu Panel.\n\`${p} setrole [category] [@role]\` - Link a database role for panels.\n\`${p} fixverify [@unv] [@ver]\` - Sync roles for old members.` },
                { name: '📢 Announcement System', value: `\`${p} announce [#channel] [title] | [msg] | [@ping]\` - Send official news.\n\`${p} schedule [time] [#channel] [title] | [msg] | [@ping]\` - Delay publish (10m, 1h, 1d).` }
            ).setFooter({ text: 'Category: Management & Welcome (Admin Only)' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'mod' || sub === 'moderation') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_moderation, '🛡️')} MODERATION PANEL`).setDescription('Tools to keep your outpost safe and clean from violations:').addFields(
                { name: '📝 Word Filter System', value: `\`${p} word add [word]\` - Add a word to the filter list.\n\`${p} word rmv [word]\` - Remove a word from the filter.\n\`${p} word list\` - View all filtered words.` },
                { name: '🔗 Link Control System', value: `\`${p} antiinvite [on/off]\` - Toggle Discord invite blocker.\n\`${p} link allow [#channel]\` - Allow links in a channel.\n\`${p} link block [#channel]\` - Block links back.\n\`${p} link list\` - View allowed link channels.` },
                { name: '🔨 Action Commands', value: `\`${p} warn / unwarn [@user]\` - Add/remove warning\n\`${p} clearwarn [@user]\` - Reset warns (0/3)\n\`${p} history [@user]\` - Lookup mod history\n\`${p} purge [@user/links] [amount]\` - Advanced purge chat\n\`${p} mute / unmute [@user]\` - Mute/unmute player\n\`${p} kick [@user] [reason]\` - Kick player\n\`${p} ban / tempban [@user] [time]\` - Ban / Tempban player\n\`${p} unban [user_id]\` - Unban player by ID\n\`${p} set mute [@role]\` - Set restricted role` }
            ).setFooter({ text: 'Category: Moderation (Admin Only)' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'sup' || sub === 'support') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_support, '🛠️')} SUPPORT & UTILITIES PANEL`).setDescription('Core configuration tools for advanced bot access modules:').addFields({ name: `\`${p} access add / rmv [@user]\``, value: 'Grant or revoke custom admin permissions to run bot commands.' },{ name: `\`${p} access list\``, value: 'Display all authorized custom bot administrators.' }, { name: '📌 Help Shortcuts', value: `\`${p} help gen\` - General\n\`${p} help pro\` - Progress\n\`${p} help cha\` - Management\n\`${p} help mod\` - Moderation\n\`${p} help sup\` - Support` }).setFooter({ text: 'Category: Support & Utilities (Admin Only)' });
            return message.reply({ embeds: [embed] });
        }

        // --- MAIN MENU TERPISAH (PLAYER VS ADMIN) ---
        
        // TAMPILAN PLAYER BIASA (NON-ADMIN)
        if (!isAdmin) {
            const playerEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription(`**For more info: ${p} help [command]**\n\n` +
                    `${getEmoji(emojis.help_profile, '🏅')} **Progress commands** ${getEmoji(emojis.help_profile, '🏅')}\n` +
                    `\`profile\`, \`clan\`, \`gamertag\`, \`inventory\`, \`likes\`, \`unlikes\`, \`album\`, \`delalbum\`\n\n` +
                    `${getEmoji(emojis.help_general, '🗺️')} **General commands** ${getEmoji(emojis.help_general, '🗺️')}\n` +
                    `\`avatar\`, \`meme\`, \`dog\`, \`cat\`, \`afk\`, \`info\`, \`vote\``)
                .setFooter({ text: 'Pioneer Outpost • Keep exploring!' });
            return message.reply({ embeds: [playerEmbed] });
        }

        // TAMPILAN ADMIN (DENGAN DROPDOWN)
        embed.setColor('#2F3136')
            .setTitle('🏕️ PIONEER OUTPOST HELP PANEL (ADMIN)')
            .setDescription('Welcome Admin! Select a category from the dropdown menu below to view available commands and server configurations.')
            .addFields(
                { name: `${getEmoji(emojis.help_general, '🧭')} General`, value: 'Basic bot interactions, user utilities, and AFK systems.', inline: true },
                { name: `${getEmoji(emojis.help_profile, '🏅')} Progress`, value: 'View player statistics, titles, badges, and customize your ID.', inline: true },
                { name: `${getEmoji(emojis.help_management, '🧱')} Ch Management & Welcome`, value: 'Tools for channel, role, locks, custom greetings, logs, and suggestions.', inline: true },
                { name: `${getEmoji(emojis.help_moderation, '🛡️')} Moderation`, value: 'Word filters and auto-moderation tools.', inline: true },
                { name: `${getEmoji(emojis.help_support, '🛠️')} Support & Utilities`, value: 'Configure custom bot access and administrator rights.', inline: true }
            )
            .setFooter({ text: 'Pioneer Support • Choose a category below' });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_menu')
                    .setPlaceholder('Select help category...')
                    .addOptions([
                        { label: 'Main Menu', description: 'Return to the main help panel', value: 'help_main', emoji: getEmoji(emojis.help_main, '🏕️') },
                        { label: 'General', description: 'Basic bot interactions and fun commands', value: 'help_general', emoji: getEmoji(emojis.help_general, '🧭') },
                        { label: 'Progress', description: 'Player statistics, titles, badges', value: 'help_profile', emoji: getEmoji(emojis.help_profile, '🏅') },
                        { label: 'Ch Management & Welcome', description: 'Tools for channel, role, locks, logs', value: 'help_management', emoji: getEmoji(emojis.help_management, '🧱') },
                        { label: 'Moderation', description: 'Word filters and auto-moderation tools', value: 'help_moderation', emoji: getEmoji(emojis.help_moderation, '🛡️') },
                        { label: 'Support & Utilities', description: 'Custom bot access and administrator rights', value: 'help_support', emoji: getEmoji(emojis.help_support, '🛠️') },
                    ])
            );

        return message.reply({ embeds: [embed], components: [row] });
    },

    // ==========================================
    // 2. SLASH COMMAND (/help ...)
    // ==========================================
    async executeSlash(interaction) {
        const p = '/';
        let sub = null;
        try { sub = interaction.options.getString('category')?.toLowerCase(); } catch (e) {}
        const isAdmin = checkIsAdmin(interaction.member);

        const emojisPath = path.join(__dirname, '../emojis.json');
        let emojis = { help_main: '🏕️', help_general: '🧭', help_profile: '👤', help_management: '🧱', help_support: '🛠️', help_moderation: '🛡️' };
        
        if (fs.existsSync(emojisPath)) {
            try {
                const parsedEmojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
                emojis = { ...emojis, ...parsedEmojis };
            } catch (error) {
                console.log('⚠️ [WARNING] File emojis.json formatnya rusak.');
            }
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

        const embed = new EmbedBuilder().setTimestamp();

        // --- SUB CATEGORIES ---
        if (sub === 'gen' || sub === 'general') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_general, '🧭')} GENERAL BOT COMMANDS`).setDescription('Here are the basic commands available for all server members:').addFields({ name: `\`${p}afk [reason]\``, value: 'Set your status to Away From Keyboard (AFK).' },{ name: `\`${p}info\``, value: 'View bot statistics, current ping, and system uptime.' },{ name: `\`${p}avatar [user]\``, value: 'Display your own or another member\'s high-resolution avatar.' },{ name: `\`${p}vote\``, value: 'Support our outpost by voting for the bot on community lists.' },{ name: `\`${p}dog / cat\``, value: 'Summon a random cute dog or cat image.' },{ name: `\`${p}meme\``, value: 'Get a random fresh meme from Reddit.' }).setFooter({ text: 'Category: General Commands' });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'pro' || sub === 'profile' || sub === 'progress') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_profile, '🏅')} PLAYER PROGRESS SYSTEM`)
            .setDescription('Manage your RPG identity, check your levels, and customize your ID card:')
            .addFields(
                { name: '📊 Progression & Stats', value: `\`${p}profile [@user]\` - View your RPG Profile card (Level, EXP, Badges).` },
                { name: '🔰 Identity & Customization', value: `\`${p}gamertag [name]\` - Set your in-game name.\n\`${p}clan [name]\` - Set your in-game clan.\n\`${p}album\` - Set a custom image (attach an image).\n\`${p}delalbum\` - Remove your custom profile image.` }
            )
            .setFooter({ text: 'Category: Progress & Ranks' });
            return interaction.reply({ embeds: [embed] });
        }

        // BLOKIR AKSES PLAYER KE MENU ADMIN
        if (sub === 'cha' || sub === 'management' || sub === 'mod' || sub === 'moderation' || sub === 'sup' || sub === 'support') {
            if (!isAdmin) return interaction.reply({ content: '❌ **Access Denied:** You do not have permission to view Admin configurations.', ephemeral: true });
        }

        if (sub === 'cha' || sub === 'management') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_management, '🧱')} CH MANAGEMENT & WELCOME SETUP`).setDescription('Configuration commands to control, structure channels, setup greetings, and logs:').addFields(
                { name: '🧱 Channel & Role Management', value: `\`${p}crt cha [name]\` - Create text channel.\n\`${p}crt cat [name]\` - Create category folder.\n\`${p}crt role [hex] [name]\` - Create custom colored role.\n\`${p}rmv [cha/cat/role]\` - Delete channel/category/role.\n\`${p}rmv msg [amount]\` - Clear chat messages.\n\`${p}lock / unlock [channel]\` - Toggle channel locks.\n\`${p}slowmode [channel] [seconds]\` - Set slowmode cooldown.` },
                { name: '👋 Welcome Greeting Configurations', value: `\`${p}set wcm [#channel]\` - Set target welcome channel.\n\`${p}wcm gif [imgur_link]\` - Pool custom background Imgur GIF.\n\`${p}wcm list\` - View registered welcome GIFs.\n\`${p}wcm rmv [num]\` - Remove custom GIF from database.` },
                { name: '📝 Ticket & Suggestion Logs', value: `\`${p}set log [#channel]\` - Set archive log channel for closed tickets.\n\`${p}set sug [#channel]\` - Set community suggestion channel.\n\`${p}suggestion\` - Deploy Suggestion Embed Panel.\n\`${p}set mod [#channel]\` - Set moderation log channel.` },
                { name: '🛡️ Security & Role Panels', value: `\`${p}verifysetup [@unv] [@ver] [#channel]\` - Deploy CAPTCHA gate.\n\`${p}rolesetup [#channel]\` - Deploy Auto-Role Menu Panel.\n\`${p}setrole [category] [@role]\` - Link a database role for panels.\n\`${p}fixverify [@unv] [@ver]\` - Sync roles for old members.` },
                { name: '📢 Announcement System', value: `\`${p}announce [#channel] [title] | [msg] | [@ping]\` - Send official news.\n\`${p}schedule [time] [#channel] [title] | [msg] | [@ping]\` - Delay publish (10m, 1h, 1d).` }
            ).setFooter({ text: 'Category: Management & Welcome (Admin Only)' });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'mod' || sub === 'moderation') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_moderation, '🛡️')} MODERATION PANEL`).setDescription('Tools to keep your outpost safe and clean from violations:').addFields(
                { name: '📝 Word Filter System', value: `\`${p}word add [word]\` - Add a word to the filter list.\n\`${p}word rmv [word]\` - Remove a word from the filter.\n\`${p}word list\` - View all filtered words.` },
                { name: '🔗 Link Control System', value: `\`${p}antiinvite [on/off]\` - Toggle Discord invite blocker.\n\`${p}link allow [#channel]\` - Allow links in a channel.\n\`${p}link block [#channel]\` - Block links back.\n\`${p}link list\` - View allowed link channels.` },
                { name: '🔨 Action Commands', value: `\`${p}warn / unwarn [@user]\` - Add/remove warning\n\`${p}clearwarn [@user]\` - Reset warns (0/3)\n\`${p}history [@user]\` - Lookup mod history\n\`${p}purge [@user/links] [amount]\` - Advanced purge chat\n\`${p}mute / unmute [@user]\` - Mute/unmute player\n\`${p}kick [@user] [reason]\` - Kick player\n\`${p}ban / tempban [@user] [time]\` - Ban / Tempban\n\`${p}unban [user_id]\` - Unban player by ID\n\`${p}set mute [@role]\` - Set restricted role` }
            ).setFooter({ text: 'Category: Moderation (Admin Only)' });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'sup' || sub === 'support') {
            embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_support, '🛠️')} SUPPORT & UTILITIES PANEL`).setDescription('Core configuration tools for advanced bot access modules:').addFields({ name: `\`${p}access add / rmv [@user]\``, value: 'Grant or revoke custom admin permissions to run bot commands.' },{ name: `\`${p}access list\``, value: 'Display all authorized custom bot administrators.' }, { name: '📌 Help Shortcuts', value: `\`${p}help gen\` - General\n\`${p}help pro\` - Progress\n\`${p}help cha\` - Management\n\`${p}help mod\` - Moderation\n\`${p}help sup\` - Support` }).setFooter({ text: 'Category: Support & Utilities (Admin Only)' });
            return interaction.reply({ embeds: [embed] });
        }

        // --- MAIN MENU TERPISAH (PLAYER VS ADMIN) ---
        
        // TAMPILAN PLAYER BIASA (NON-ADMIN)
        if (!isAdmin) {
            const playerEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription(`**For more info: ${p}help [command]**\n\n` +
                    `${getEmoji(emojis.help_profile, '🏅')} **Progress commands** ${getEmoji(emojis.help_profile, '🏅')}\n` +
                    `\`profile\`, \`clan\`, \`gamertag\`, \`inventory\`, \`likes\`, \`unlikes\`, \`album\`, \`delalbum\`\n\n` +
                    `${getEmoji(emojis.help_general, '🗺️')} **General commands** ${getEmoji(emojis.help_general, '🗺️')}\n` +
                    `\`avatar\`, \`meme\`, \`dog\`, \`cat\`, \`afk\`, \`info\`, \`vote\``)
                .setFooter({ text: 'Pioneer Outpost • Keep exploring!' });
            return interaction.reply({ embeds: [playerEmbed] });
        }

        // TAMPILAN ADMIN (DENGAN DROPDOWN)
        embed.setColor('#2F3136')
            .setTitle('🏕️ PIONEER OUTPOST HELP PANEL (ADMIN)')
            .setDescription('Welcome Admin! Select a category from the dropdown menu below to view available commands and server configurations.')
            .addFields(
                { name: `${getEmoji(emojis.help_general, '🧭')} General`, value: 'Basic bot interactions, user utilities, and AFK systems.', inline: true },
                { name: `${getEmoji(emojis.help_profile, '🏅')} Progress`, value: 'View player statistics, titles, badges, and customize your ID.', inline: true },
                { name: `${getEmoji(emojis.help_management, '🧱')} Ch Management & Welcome`, value: 'Tools for channel, role, locks, custom greetings, logs, and suggestions.', inline: true },
                { name: `${getEmoji(emojis.help_moderation, '🛡️')} Moderation`, value: 'Word filters and auto-moderation tools.', inline: true },
                { name: `${getEmoji(emojis.help_support, '🛠️')} Support & Utilities`, value: 'Configure custom bot access and administrator rights.', inline: true }
            )
            .setFooter({ text: 'Pioneer Support • Choose a category below' });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_menu')
                    .setPlaceholder('Select help category...')
                    .addOptions([
                        { label: 'Main Menu', description: 'Return to the main help panel', value: 'help_main', emoji: getEmoji(emojis.help_main, '🏕️') },
                        { label: 'General', description: 'Basic bot interactions and fun commands', value: 'help_general', emoji: getEmoji(emojis.help_general, '🧭') },
                        { label: 'Progress', description: 'Player statistics, titles, badges', value: 'help_profile', emoji: getEmoji(emojis.help_profile, '🏅') },
                        { label: 'Ch Management & Welcome', description: 'Tools for channel, role, locks, logs', value: 'help_management', emoji: getEmoji(emojis.help_management, '🧱') },
                        { label: 'Moderation', description: 'Word filters and auto-moderation tools', value: 'help_moderation', emoji: getEmoji(emojis.help_moderation, '🛡️') },
                        { label: 'Support & Utilities', description: 'Custom bot access and administrator rights', value: 'help_support', emoji: getEmoji(emojis.help_support, '🛠️') },
                    ])
            );

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};