const { EmbedBuilder } = require('discord.js');
const { saveSettings } = require('../../utils/database');

module.exports = {
    name: 'access',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin) return message.reply('❌ Only real Server Admins can use this!');
        const sub = args[0] ? args[0].toLowerCase() : null;
        let authUsers = settings[message.guild.id].authorizedUsers;

        if (sub === 'add') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ Please mention the user!');
            if (authUsers.includes(target.id)) return message.reply('ℹ️ User already has access.');
            authUsers.push(target.id);
            saveSettings(settings);
            return message.reply(`✅ Granted bot access to ${target}!`);
        }
        if (sub === 'rmv') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ Please mention the user!');
            authUsers = authUsers.filter(id => id !== target.id);
            settings[message.guild.id].authorizedUsers = authUsers;
            saveSettings(settings);
            return message.reply(`✅ Revoked bot access from ${target}.`);
        }
        if (sub === 'list') {
            if (authUsers.length === 0) return message.reply('ℹ️ No custom bot admins.');
            const embed = new EmbedBuilder().setTitle('🛡️ Authorized Bot Admins').setDescription(authUsers.map((id, index) => `**${index + 1}.** <@${id}>`).join('\n'));
            return message.reply({ embeds: [embed] });
        }
    },
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin) return interaction.reply({ content: '❌ Only real Server Admins can use this!', ephemeral: true });
        const sub = interaction.options.getSubcommand();
        let authUsers = settings[interaction.guild.id].authorizedUsers;

        if (sub === 'add') {
            const user = interaction.options.getUser('user');
            if (authUsers.includes(user.id)) return interaction.reply('ℹ️ User already has access.');
            authUsers.push(user.id);
            saveSettings(settings);
            return interaction.reply(`✅ Granted bot access to ${user}!`);
        }
        if (sub === 'rmv') {
            const user = interaction.options.getUser('user');
            authUsers = authUsers.filter(id => id !== user.id);
            settings[interaction.guild.id].authorizedUsers = authUsers;
            saveSettings(settings);
            return interaction.reply(`✅ Revoked bot access from ${user}.`);
        }
        if (sub === 'list') {
            if (authUsers.length === 0) return interaction.reply('ℹ️ No custom bot admins.');
            const embed = new EmbedBuilder().setTitle('🛡️ Authorized Bot Admins').setDescription(authUsers.map((id, index) => `**${index + 1}.** <@${id}>`).join('\n'));
            return interaction.reply({ embeds: [embed] });
        }
    }
};
