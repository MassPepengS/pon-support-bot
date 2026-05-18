module.exports = {
    name: 'slowmode',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return message.reply('❌ No permission!');

        let channel = message.mentions.channels.first();
        let timeRaw = channel ? args[1] : args[0];
        if (!channel) channel = message.channel;

        const seconds = parseInt(timeRaw);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
            return message.reply('❌ Slowmode must be between 0 and 21600 seconds (6 hours). Example: `pon slowmode #channel 10`');
        }

        try {
            await channel.setRateLimitPerUser(seconds);
            if (seconds === 0) return message.reply(`⏳ Slowmode for ${channel} has been **disabled**.`);
            return message.reply(`⏳ Slowmode for ${channel} is now set to **${seconds} seconds**.`);
        } catch (err) {
            return message.reply('❌ Failed to set slowmode.');
        }
    },

    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return interaction.reply({ content: '❌ No permission!', ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        const seconds = interaction.options.getInteger('seconds');

        if (seconds < 0 || seconds > 21600) {
            return interaction.reply({ content: '❌ Slowmode must be between 0 and 21600 seconds (6 hours).', ephemeral: true });
        }

        try {
            await channel.setRateLimitPerUser(seconds);
            if (seconds === 0) return interaction.reply(`⏳ Slowmode for ${channel} has been **disabled**.`);
            return interaction.reply(`⏳ Slowmode for ${channel} is now set to **${seconds} seconds**.`);
        } catch (err) {
            return interaction.reply('❌ Failed to set slowmode.');
        }
    }
};
