const fs = require('fs');

module.exports = {
    name: 'set',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return message.reply('❌ No permission!');

        const sub = args[0] ? args[0].toLowerCase() : null;

        // Set Welcome Channel
        if (sub === 'wcm') {
            const chan = message.mentions.channels.first();
            if (!chan) {
                const errMsg = await message.reply('❌ Please mention a channel! Example: `pon set wcm #channel`');
                setTimeout(() => errMsg.delete().catch(() => {}), 5000);
                return;
            }
            settings[message.guild.id].channelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            const replyMsg = await message.reply(`✅ Success! Welcome target set to ${chan}`);

            setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
            await message.delete().catch(() => {});
            return;
        }

        // Set Log Channel (UNTUK TICKET TRANSCRIPT)
        if (sub === 'log') {
            const chan = message.mentions.channels.first();
            if (!chan) {
                const errMsg = await message.reply('❌ Please mention a channel! Example: `pon set log #admin-logs`');
                setTimeout(() => errMsg.delete().catch(() => {}), 5000);
                return;
            }
            settings[message.guild.id].logChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            const replyMsg = await message.reply(`✅ Success! Ticket transcripts will now be sent to ${chan}`);

            setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
            await message.delete().catch(() => {});
            return;
        }

        // Set Suggestion Channel (UNTUK POSTINGAN IDE MEMBER)
        if (sub === 'sug') {
            const chan = message.mentions.channels.first();
            if (!chan) {
                const errMsg = await message.reply('❌ Please mention a channel! Example: `pon set sug #vote-saran`');
                setTimeout(() => errMsg.delete().catch(() => {}), 5000);
                return;
            }
            settings[message.guild.id].suggestionChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            const replyMsg = await message.reply(`✅ Success! Suggestion posts will now be sent to ${chan}`);

            setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
            await message.delete().catch(() => {});
            return;
        }

        // Set Moderation Log Channel (UNTUK AUTOMOD, WARN, KICK, BAN)
        if (sub === 'mod' || sub === 'moderation') {
            const chan = message.mentions.channels.first();
            if (!chan) {
                const errMsg = await message.reply('❌ Please mention a channel! Example: `pon set mod #moderation-logs`');
                setTimeout(() => errMsg.delete().catch(() => {}), 5000);
                return;
            }
            settings[message.guild.id].modLogChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            const replyMsg = await message.reply(`✅ Success! Moderation & AutoMod logs will now be sent to ${chan}`);

            setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
            await message.delete().catch(() => {});
            return;
        }

        const invalidMsg = await message.reply('❌ Invalid command! Use `pon set wcm`, `pon set log`, `pon set sug`, or `pon set mod`.');
        setTimeout(() => invalidMsg.delete().catch(() => {}), 5000);
    },

    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return interaction.reply({ content: '❌ No permission!', ephemeral: true });

        const sub = interaction.options.getSubcommand();

        if (sub === 'wcm') {
            const chan = interaction.options.getChannel('channel');
            settings[interaction.guild.id].channelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return interaction.reply({ content: `✅ Success! Welcome target set to ${chan}`, ephemeral: true });
        }

        if (sub === 'log') {
            const chan = interaction.options.getChannel('channel');
            settings[interaction.guild.id].logChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return interaction.reply({ content: `✅ Success! Ticket transcripts will now be sent to ${chan}`, ephemeral: true });
        }

        if (sub === 'sug') {
            const chan = interaction.options.getChannel('channel');
            settings[interaction.guild.id].suggestionChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return interaction.reply({ content: `✅ Success! Suggestion posts will now be sent to ${chan}`, ephemeral: true });
        }

        if (sub === 'mod' || sub === 'moderation') {
            const chan = interaction.options.getChannel('channel');
            settings[interaction.guild.id].modLogChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return interaction.reply({ content: `✅ Success! Moderation & AutoMod logs will now be sent to ${chan}`, ephemeral: true });
        }
    }
};
