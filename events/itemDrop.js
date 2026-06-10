const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) { // Pastikan 'client' dimasukkan di parameter
        // Abaikan bot dan pastikan hanya di dalam server
        if (message.author.bot || !message.guild) return;

        // Abaikan pesan jika itu adalah sebuah command
        if (message.content.toLowerCase().startsWith(client.PREFIX.toLowerCase() + ' ')) return;

        // --- CHARISMA ITEM DROP SYSTEM (HARD MODE: 5% Total Chance) ---
        const rng = Math.random() * 100;
        let droppedItem = null;

        // Sistem Kalkulasi RNG Bertingkat (SOP Fitur Tetap Utuh)
        if (rng <= 0.1) droppedItem = { id: 'coins', name: 'Coins', emoji: '<:giftcoin:1510283704021418185>' };
        else if (rng <= 0.4) droppedItem = { id: 'treasure', name: 'Treasure Maps', emoji: '<:gifttreasure:1510283600837349446>' };
        else if (rng <= 1.0) droppedItem = { id: 'box', name: 'Box', emoji: '<:giftbox:1510283431802704022>' };
        else if (rng <= 2.5) droppedItem = { id: 'cake', name: 'Cake', emoji: '<:giftcake:1510283539470483636>' };
        else if (rng <= 5.0) droppedItem = { id: 'rose', name: 'Rose', emoji: '<:giftrose:1510280805383934072>' };

        if (!droppedItem) return;

        const guildId = message.guild.id;
        const userId = message.author.id;

        // 🚀 1. TARIK DATA DARI MESIN RAM
        const userData = client.getProfile(guildId, userId);
        
        // Lapisan pelindung inventory
        if (!userData.inventory[droppedItem.id]) userData.inventory[droppedItem.id] = 0;
        userData.inventory[droppedItem.id] += 1;
        
        client.saveProfile(); // Simpan di background secara instan

        // 🚀 2. TARIK SETTINGS DARI MESIN RAM
        const settings = client.checkDatabase(guildId);
        const giftChannelId = settings.giftChannelId;

        if (giftChannelId) {
            const giftChannel = message.guild.channels.cache.get(giftChannelId);
            if (giftChannel) {
                const dropEmbed = new EmbedBuilder()
                    .setColor('#2F3136') 
                    .setDescription(`✨ **A wild item appeared!**\nYou just found a ${droppedItem.emoji} **${droppedItem.name}** while chatting! Check your inventory.`);
                
                giftChannel.send({ content: `<@${userId}>`, embeds: [dropEmbed] }).catch(() => {});
            }
        }
    }
};