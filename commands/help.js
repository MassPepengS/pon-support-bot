const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    async executePrefix(message, args) {
        return this.sendHelpMenu(message, 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.sendHelpMenu(interaction, 'SLASH');
    },

    async sendHelpMenu(ctx, type) {
        // Membaca file emoji kustom terpisah
        const emojisPath = path.join(__dirname, '../emojis.json');
        let emojis = { help_main: '🏕️', help_general: '🧭', help_profile: '👤', help_management: '🧱', help_support: '🛠️' };
        if (fs.existsSync(emojisPath)) {
            emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
        }

        // 🛠️ FILTER PINTAR: Mengambil ID angka saja khusus untuk Dropdown Menu
        const getComponentEmoji = (emojiStr) => {
            if (!emojiStr) return undefined;
            if (emojiStr.startsWith('<')) {
                const match = emojiStr.match(/\d+/);
                return match ? match[0] : emojiStr;
            }
            return emojiStr; // Kalau emoji biasa (bawaan HP), kembalikan seperti biasa
        };

        // EMBED UTAMA (Teks bebas pakai format lengkap)
        const mainEmbed = new EmbedBuilder()
            .setColor('#2F3136') 
            .setTitle('🏕️ PIONEER OUTPOST HELP PANEL')
            .setDescription('Welcome Explorer! Select a category from the dropdown menu below to view available commands and server configurations.')
            .addFields(
                { name: `${emojis.help_general || '🧭'} General`, value: 'Basic bot interactions, user utilities, fun commands, and AFK.', inline: true },
                { name: `${emojis.help_profile || '👤'} Profile`, value: 'View player statistics, titles, badges, gamble and games. *(Coming Soon)*', inline: true },
                { name: `${emojis.help_management || '🧱'} Ch Management & Welcome`, value: 'Tools for channel, role, locks, custom greetings, logs, and suggestions.', inline: true },
                { name: `${emojis.help_support || '🛠️'} Support & Utilities`, value: 'Configure custom bot access and administrator rights.', inline: true }
            )
            .setFooter({ text: 'Pioneer Support • Choose a category below' })
            .setTimestamp();

        // MEMBUAT DROPDOWN MENU (Menggunakan filter ID)
        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Select help category...')
            .addOptions([
                {
                    label: 'Main Menu',
                    description: 'Back to the main help dashboard',
                    value: 'help_main',
                    emoji: getComponentEmoji(emojis.help_main || '🏕️')
                },
                {
                    label: 'General Commands',
                    description: 'View basic commands like AFK, Meme, Dog, Cat, etc.',
                    value: 'help_general',
                    emoji: getComponentEmoji(emojis.help_general || '🧭')
                },
                {
                    label: 'Profile System',
                    description: 'View badges, titles, and leaderboards (Coming Soon)',
                    value: 'help_profile',
                    emoji: getComponentEmoji(emojis.help_profile || '👤')
                },
                {
                    label: 'Ch Management & Welcome',
                    description: 'Manage channels, roles, locks, welcome setup, and logs',
                    value: 'help_management',
                    emoji: getComponentEmoji(emojis.help_management || '🧱')
                },
                {
                    label: 'Support & Utilities',
                    description: 'Configure custom bot access and admin rights',
                    value: 'help_support',
                    emoji: getComponentEmoji(emojis.help_support || '🛠️')
                }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        if (type === 'SLASH') {
            return ctx.reply({ embeds: [mainEmbed], components: [row] });
        } else {
            return ctx.channel.send({ embeds: [mainEmbed], components: [row] });
        }
    }
};
