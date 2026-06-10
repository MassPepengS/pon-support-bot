const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Database informasi item dan emoji
const itemData = {
    'rose': { name: 'Rose', emoji: '<:giftrose:1510280805383934072>' },
    'cake': { name: 'Cake', emoji: '<:giftcake:1510283539470483636>' },
    'box': { name: 'Box', emoji: '<:giftbox:1510283431802704022>' },
    'treasure': { name: 'Treasure Maps', emoji: '<:gifttreasure:1510283600837349446>' },
    'coins': { name: 'Coins', emoji: '<:giftcoin:1510283704021418185>' }
};

function getInventoryEmbed(targetUser, guildId, client) {
    // 🚀 BACA DARI MESIN RAM
    const userData = client.getProfile(guildId, targetUser.id);
    
    // Jika player belum punya data atau inventory kosong
    if (!userData.inventory || Object.keys(userData.inventory).length === 0) {
        return new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('Inventory')
            .setDescription('**Inventory - Page 1/1**\n**Category:** Items\n\n*Your inventory is currently empty.*')
            .setFooter({ text: `Viewer: ${targetUser.username}` })
            .setTimestamp();
    }

    const inv = userData.inventory;
    let invList = [];

    // Looping untuk mengecek item apa saja yang dimiliki player
    for (const [itemId, amount] of Object.entries(inv)) {
        if (amount > 0 && itemData[itemId]) {
            invList.push(`${itemData[itemId].emoji} **${itemData[itemId].name}** — x${amount}`);
        }
    }

    let desc = '**Inventory - Page 1/1**\n**Category:** Items\n\n';
    if (invList.length === 0) {
        desc += '*Your inventory is currently empty.*';
    } else {
        desc += invList.join('\n');
    }

    return new EmbedBuilder()
        .setColor('#2F3136')
        .setTitle('Inventory')
        .setDescription(desc)
        .setFooter({ text: `Viewer: ${targetUser.username}` })
        .setTimestamp();
}

module.exports = {
    name: 'inventory',
    aliases: ['inv', 'i'], 
    description: 'View your or another player\'s item inventory.',
    
    async executePrefix(message, args) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            targetUser = await message.client.users.fetch(args[0]).catch(() => null);
        }
        if (!targetUser) targetUser = message.author;

        if (targetUser.bot) return message.reply({ content: '❌ Bots do not have an inventory.' });

        const embed = getInventoryEmbed(targetUser, message.guild.id, message.client);
        return message.reply({ embeds: [embed] });
    },

    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your or another player\'s item inventory.')
        .addUserOption(option => option.setName('user').setDescription('Select a user (Optional)').setRequired(false)),

    async executeSlash(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        if (targetUser.bot) return interaction.reply({ content: '❌ Bots do not have an inventory.', ephemeral: true });

        const embed = getInventoryEmbed(targetUser, interaction.guild.id, interaction.client);
        return interaction.reply({ embeds: [embed] });
    }
};