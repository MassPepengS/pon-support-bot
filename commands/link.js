const fs = require('fs');

module.exports = {
    name: 'link',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        
        // Proteksi khusus Admin
        if (!isRealAdmin && !isCustomAdmin) {
            return message.reply("❌ You don't have permission to use this command.");
        }

        if (args.length === 0) {
            return message.reply("ℹ️ **Usage:**\n`pon link allow [#channel]` - Allow links in a channel\n`pon link block [#channel]` - Block links in a channel\n`pon link list` - View channels where links are allowed");
        }

        const action = args[0].toLowerCase();
        const guildId = message.guild.id;

        // Pastikan database array untuk link sudah siap
        if (!settings[guildId].linkAllowedChannels) settings[guildId].linkAllowedChannels = [];

        // COMMAND: ALLOW (MENGIZINKAN LINK)
        if (action === 'allow' || action === 'active') {
            const targetChannel = message.mentions.channels.first();
            if (!targetChannel) return message.reply("❌ Please mention a valid channel. Example: `pon link allow #general`");

            if (settings[guildId].linkAllowedChannels.includes(targetChannel.id)) {
                return message.reply(`⚠️ Links are already allowed in ${targetChannel}.`);
            }

            settings[guildId].linkAllowedChannels.push(targetChannel.id);
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Successfully **ALLOWED** links in ${targetChannel}. Members can now share links here!`);
        }

        // COMMAND: BLOCK (MELARANG LINK KEMBALI)
        if (action === 'block' || action === 'nonactive' || action === 'rmv') {
            const targetChannel = message.mentions.channels.first();
            if (!targetChannel) return message.reply("❌ Please mention a valid channel. Example: `pon link block #general`");

            const index = settings[guildId].linkAllowedChannels.indexOf(targetChannel.id);
            if (index === -1) {
                return message.reply(`⚠️ Links are already blocked in ${targetChannel} (Default rule).`);
            }

            settings[guildId].linkAllowedChannels.splice(index, 1);
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            return message.reply(`✅ Successfully **BLOCKED** links in ${targetChannel}. Auto-Mod will now delete links here.`);
        }

        // COMMAND: LIST
        if (action === 'list') {
            const list = settings[guildId].linkAllowedChannels;
            if (!list || list.length === 0) {
                return message.reply("📝 Links are currently **blocked** in ALL channels (except for Admins).");
            }
            const channelMentions = list.map(id => `<#${id}>`).join('\n');
            return message.reply(`📝 **Channels with Links ALLOWED:**\n${channelMentions}`);
        }

        return message.reply("❌ Invalid action. Please use `allow`, `block`, or `list`.");
    }
};
