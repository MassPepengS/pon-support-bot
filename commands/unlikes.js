const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'unlikes',
    description: 'Remove your like from another player\'s RPG profile.',

    async executePrefix(message, args) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            targetUser = await message.client.users.fetch(args[0]).catch(() => null);
        }
        if (!targetUser) return message.reply('❌ **Usage:** `pon unlikes [@user/ID]`');

        const guildId = message.guild.id;
        
        // 🚀 BACA DARI MESIN RAM (Otomatis terbuat jika belum ada)
        const userData = message.client.getProfile(guildId, targetUser.id);
        
        const index = userData.likes.indexOf(message.author.id);
        if (index === -1) {
            return message.reply(`⚠️ You haven't liked **${targetUser.username}**'s profile yet!`);
        }

        // Hapus like dan simpan di background secara instan
        userData.likes.splice(index, 1);
        message.client.saveProfile();

        return message.reply(`✅ You have successfully removed your like from **${targetUser.username}**'s profile.`);
    },

    data: new SlashCommandBuilder()
        .setName('unlikes')
        .setDescription('Remove your like from another player\'s RPG profile.')
        .addUserOption(opt => opt.setName('user').setDescription('Select a player').setRequired(true)),

    async executeSlash(interaction) {
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        
        // 🚀 BACA DARI MESIN RAM (Otomatis terbuat jika belum ada)
        const userData = interaction.client.getProfile(guildId, targetUser.id);

        const index = userData.likes.indexOf(interaction.user.id);
        if (index === -1) {
            return interaction.reply({ content: `⚠️ You haven't liked **${targetUser.username}**'s profile yet!`, ephemeral: true });
        }

        // Hapus like dan simpan di background secara instan
        userData.likes.splice(index, 1);
        interaction.client.saveProfile();

        return interaction.reply({ content: `✅ You have successfully removed your like from **${targetUser.username}**'s profile.`, ephemeral: true });
    }
};