const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'gamertag',
    description: 'Set your in-game Gamertag for your RPG profile.',

    async executePrefix(message, args) {
        const tag = args.join(' ').trim();
        if (!tag) return message.reply('❌ **Usage:** `pon gamertag [your_ingame_name]`');

        const guildId = message.guild.id;
        const userId = message.author.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = message.client.getProfile(guildId, userId);
        userData.gamertag = tag;
        message.client.saveProfile();

        return message.reply(`✅ **Gamertag Updated!** Your profile now shows your gamertag as: \`${tag}\``);
    },

    data: new SlashCommandBuilder()
        .setName('gamertag')
        .setDescription('Set your in-game Gamertag.')
        .addStringOption(opt => opt.setName('name').setDescription('Your in-game name').setRequired(true)),

    async executeSlash(interaction) {
        const tag = interaction.options.getString('name');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = interaction.client.getProfile(guildId, userId);
        userData.gamertag = tag;
        interaction.client.saveProfile();

        return interaction.reply({ content: `✅ **Gamertag Updated!** Your profile now shows your gamertag as: \`${tag}\``, ephemeral: true });
    }
};