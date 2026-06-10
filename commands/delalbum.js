const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'delalbum',
    description: 'Remove the custom album image from your RPG profile.',

    async executePrefix(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = message.client.getProfile(guildId, userId);
        userData.album = null;
        message.client.saveProfile();

        return message.reply('✅ **Album Removed!** Your profile image has been successfully cleared.');
    },

    data: new SlashCommandBuilder()
        .setName('delalbum')
        .setDescription('Remove the custom album image from your RPG profile.'),

    async executeSlash(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = interaction.client.getProfile(guildId, userId);
        userData.album = null;
        interaction.client.saveProfile();

        return interaction.reply({ content: '✅ **Album Removed!** Your profile image has been successfully cleared.', ephemeral: true });
    }
};