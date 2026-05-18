const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'cat',
    async executePrefix(message, args) {
        return this.sendCat(message, 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.sendCat(interaction, 'SLASH');
    },

    async sendCat(ctx, type) {
        try {
            if (type === 'SLASH') await ctx.deferReply();

            const response = await fetch('https://api.thecatapi.com/v1/images/search', { signal: AbortSignal.timeout(8000) });
            const data = await response.json();
            const imageUrl = data[0].url;

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🐱 Meow!')
                .setImage(imageUrl)
                .setFooter({ text: 'Pon Cutes' });

            if (type === 'SLASH') {
                return ctx.editReply({ embeds: [embed] });
            } else {
                return ctx.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            const errorMsg = '❌ Failed to fetch cat image. Try again later!';
            if (type === 'SLASH') {
                if (ctx.deferred) return ctx.editReply({ content: errorMsg });
                return ctx.reply({ content: errorMsg, ephemeral: true });
            }
            else return ctx.channel.send({ content: errorMsg });
        }
    }
};
