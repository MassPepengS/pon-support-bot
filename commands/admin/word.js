const { saveSettings } = require('../../utils/database');

module.exports = {
    name: 'word',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        
        // Proteksi: Hanya Admin (Real/Custom) yang bisa menggunakan command ini
        if (!isRealAdmin && !isCustomAdmin) {
            return message.reply("❌ You don't have permission to use this command.");
        }

        // Jika user hanya mengetik 'pon word'
        if (args.length === 0) {
            return message.reply("ℹ️ **Usage:**\n`pon word add [word]` - Add a word to the filter\n`pon word rmv [word]` - Remove a word from the filter\n`pon word list` - View filtered words");
        }

        const action = args[0].toLowerCase(); // add, rmv, atau list
        const wordInput = args.slice(1).join(' ').toLowerCase(); // Kata yang ingin dimasukkan/dihapus
        const guildId = message.guild.id;

        // Pastikan array badWords ada di database guild ini
        if (!settings[guildId].badWords) {
            settings[guildId].badWords = [];
        }

        // COMMAND: pon word add [kata] (atau pon word crt [kata])
        if (action === 'add' || action === 'crt') {
            if (!wordInput) return message.reply("❌ Please specify a word to add.");
            
            // Cek apakah kata sudah ada
            if (settings[guildId].badWords.includes(wordInput)) {
                return message.reply("⚠️ That word is already in the filter list.");
            }
            
            settings[guildId].badWords.push(wordInput);
            saveSettings(settings);
            return message.reply(`✅ Successfully added **"${wordInput}"** to the filter list.`);
        }

        // COMMAND: pon word rmv [kata]
        if (action === 'rmv') {
            if (!wordInput) return message.reply("❌ Please specify a word to remove.");
            
            const index = settings[guildId].badWords.indexOf(wordInput);
            if (index === -1) {
                return message.reply("⚠️ That word is not in the filter list.");
            }
            
            settings[guildId].badWords.splice(index, 1);
            saveSettings(settings);
            return message.reply(`✅ Successfully removed **"${wordInput}"** from the filter list.`);
        }

        // COMMAND: pon word list
        if (action === 'list') {
            const list = settings[guildId].badWords;
            if (!list || list.length === 0) {
                return message.reply("📝 The filter list is currently empty.");
            }
            return message.reply(`📝 **Filtered Words:**\n\`${list.join(', ')}\``);
        }

        // Jika salah ketik action
        return message.reply("❌ Invalid action. Please use `add`, `rmv`, or `list`.");
    }
};
