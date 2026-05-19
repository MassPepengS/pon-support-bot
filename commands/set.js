const fs = require('fs');
module.exports = {
    name: 'set',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return message.reply('❌ No permission!');
        const sub = args[0] ? args[0].toLowerCase() : null;

        if (sub === 'wcm') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            settings[message.guild.id].channelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Success! Welcome target set to ${chan}`);
        }
        if (sub === 'log') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            settings[message.guild.id].logChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Success! Ticket transcripts will now be sent to ${chan}`);
        }
        if (sub === 'sug') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            settings[message.guild.id].suggestionChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Success! Suggestion posts will now be sent to ${chan}`);
        }
        if (sub === 'mod' || sub === 'moderation') {
            const chan = message.mentions.channels.first();
            if (!chan) return message.reply('❌ Please mention a channel!');
            settings[message.guild.id].modLogChannelId = chan.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Success! Moderation logs will now be sent to ${chan}`);
        }
        if (sub === 'mute') {
            const role = message.mentions.roles.first();
            if (!role) return message.reply('❌ Please mention a role! Example: `pon set mute @Muted`');
            settings[message.guild.id].muteRoleId = role.id;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Success! Auto-Mute restricted role set to **${role.name}**`);
        }
        return message.reply('❌ Invalid command! Use `wcm`, `log`, `sug`, `mod`, or `mute`.');
    }
};
