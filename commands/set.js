const fs = require('fs');

module.exports = {
    name: 'set',

    // ==========================================
    // 1. PREFIX COMMAND (pon set ...)
    // ==========================================
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return message.reply('❌ No permission!');
        const sub = args[0] ? args[0].toLowerCase() : null;
        const guildId = message.guild.id;

        // 🚀 INJEKSI MUTLAK KE MESIN RAM (Supaya Warn.js bisa baca)
        const guildSettings = message.client.checkDatabase(guildId);

        const saveSettings = (msg) => {
            fs.writeFile(SETTINGS_FILE, JSON.stringify(message.client.databaseCache, null, 2), (err) => {
                if (err) console.error("Save error:", err);
            });
            return message.reply(`✅ Success! ${msg}`);
        };

        if (sub === 'wcm') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            guildSettings.channelId = chan.id;
            return saveSettings(`Welcome target set to ${chan}`);
        }
        if (sub === 'log') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            guildSettings.logChannelId = chan.id;
            return saveSettings(`Ticket transcripts will now be sent to ${chan}`);
        }
        if (sub === 'sug') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            guildSettings.suggestionChannelId = chan.id;
            return saveSettings(`Suggestion posts will now be sent to ${chan}`);
        }
        if (sub === 'mod' || sub === 'moderation') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            guildSettings.modLogChannelId = chan.id;
            return saveSettings(`Moderation logs will now be sent to ${chan}`);
        }
        if (sub === 'mute') {
            const role = message.mentions.roles.first();
            if (!role) return message.reply('❌ Please mention a role! Example: \`pon set mute @Muted\`');
            guildSettings.muteRoleId = role.id;
            return saveSettings(`Auto-Mute restricted role set to **${role.name}**`);
        }
        if (sub === 'gift') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel! Example: \`pon set gift #channel\`');
            guildSettings.giftChannelId = chan.id;
            return saveSettings(`🎁 Gift drop notifications will now be sent to ${chan}`);
        }
        if (sub === 'level') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel! Example: \`pon set level #channel\`');
            guildSettings.levelChannelId = chan.id;
            return saveSettings(`🆙 Level up notifications will now be sent to ${chan}`);
        }
        
        return message.reply('❌ Invalid command! Use `wcm`, `log`, `sug`, `mod`, `mute`, `gift`, or `level`.');
    },

    // ==========================================
    // 2. SLASH COMMAND (/set ...)
    // ==========================================
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) {
            return interaction.reply({ content: '❌ No permission!', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // 🚀 INJEKSI MUTLAK KE MESIN RAM (Supaya Warn.js bisa baca)
        const guildSettings = interaction.client.checkDatabase(guildId);

        const saveSettings = async (msg) => {
            fs.writeFile(SETTINGS_FILE, JSON.stringify(interaction.client.databaseCache, null, 2), (err) => {
                if (err) console.error("Save error:", err);
            });
            return interaction.reply({ content: `✅ Success! ${msg}`, ephemeral: true });
        };

        if (sub === 'wcm') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.channelId = chan.id;
            return saveSettings(`Welcome target set to ${chan}`);
        }
        if (sub === 'log') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.logChannelId = chan.id;
            return saveSettings(`Ticket transcripts will now be sent to ${chan}`);
        }
        if (sub === 'sug') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.suggestionChannelId = chan.id;
            return saveSettings(`Suggestion posts will now be sent to ${chan}`);
        }
        if (sub === 'mod') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.modLogChannelId = chan.id;
            return saveSettings(`Moderation logs will now be sent to ${chan}`);
        }
        if (sub === 'mute') {
            const role = interaction.options.getRole('role');
            guildSettings.muteRoleId = role.id;
            return saveSettings(`Auto-Mute restricted role set to **${role.name}**`);
        }
        if (sub === 'gift') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.giftChannelId = chan.id;
            return saveSettings(`🎁 Gift drop notifications will now be sent to ${chan}`);
        }
        if (sub === 'level') {
            const chan = interaction.options.getChannel('channel');
            guildSettings.levelChannelId = chan.id;
            return saveSettings(`🆙 Level up notifications will now be sent to ${chan}`);
        }
    }
};