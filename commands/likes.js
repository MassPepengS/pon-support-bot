const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'likes',
    description: 'Give a like to another player\'s RPG profile.',

    async executePrefix(message, args) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            targetUser = await message.client.users.fetch(args[0]).catch(() => null);
        }
        if (!targetUser) return message.reply('❌ **Usage:** `pon likes [@user/ID]`');
        if (targetUser.bot) return message.reply('❌ You cannot like a bot profile.');
        if (targetUser.id === message.author.id) return message.reply('❌ You cannot like your own profile!');

        const guildId = message.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = message.client.getProfile(guildId, targetUser.id);

        if (userData.likes.includes(message.author.id)) {
            return message.reply(`⚠️ You have already liked **${targetUser.username}**'s profile!`);
        }

        userData.likes.push(message.author.id);
        message.client.saveProfile();

        return message.reply(`✅ Successfully given a like to **${targetUser.username}**'s profile!`);
    },

    data: new SlashCommandBuilder()
        .setName('likes')
        .setDescription('Give a like to another player\'s RPG profile.')
        .addUserOption(opt => opt.setName('user').setDescription('Select a player').setRequired(true)),

    async executeSlash(interaction) {
        const targetUser = interaction.options.getUser('user');
        if (targetUser.bot) return interaction.reply({ content: '❌ You cannot like a bot profile.', ephemeral: true });
        if (targetUser.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot like your own profile!', ephemeral: true });

        const guildId = interaction.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = interaction.client.getProfile(guildId, targetUser.id);

        if (userData.likes.includes(interaction.user.id)) {
            return interaction.reply({ content: `⚠️ You have already liked **${targetUser.username}**'s profile!`, ephemeral: true });
        }

        userData.likes.push(interaction.user.id);
        interaction.client.saveProfile();

        return interaction.reply({ content: `✅ Successfully given a like to **${targetUser.username}**'s profile!`, ephemeral: true });
    }
};