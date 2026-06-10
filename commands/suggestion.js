const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'suggestion',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return message.reply('❌ Only Outpost Commanders can deploy this!');
        return this.deployPanel(message);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) return interaction.reply({ content: '❌ Only Outpost Commanders can deploy this!', ephemeral: true });
        return this.deployPanel(interaction);
    },

    async deployPanel(ctx) {
        const isSlash = !!ctx.commandName;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('💡 PIONEER IDEAS & SUGGESTIONS')
            .setDescription('-# Have a thought that could make **Pioneer Outpost Nusa** even greater? Share it with the community!\n\n• Click the button below to submit your suggestion.\n• The community can vote using ⬆️ and ⬇️ reactions.\n• Highly voted ideas will be reviewed and possibly implemented by the Outpost Commanders.\n\n*Help us build a better world!*')
            .setImage('https://i.imgur.com/0fQFrmQ.png'); // <--- GIF BARU SUDAH DIPASANG DI SINI

        const btn = new ButtonBuilder()
            .setCustomId('create_suggestion')
            .setLabel('CREATE SUGGESTION')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝');

        const row = new ActionRowBuilder().addComponents(btn);

        if (isSlash) {
            await ctx.reply({ embeds: [embed], components: [row] });
        } else {
            if (ctx.deletable) await ctx.delete().catch(() => {});
            await ctx.channel.send({ embeds: [embed], components: [row] });
        }
    }
};
