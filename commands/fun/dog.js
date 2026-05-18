const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'dog',
    async executePrefix(message, args) {
        return this.sendDog(message, 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.sendDog(interaction, 'SLASH');
    },

    async sendDog(ctx, type) {
        try {
            if (type === 'SLASH') await ctx.deferReply();

            const response = await fetch('https://dog.ceo/api/breeds/image/random', { signal: AbortSignal.timeout(8000) });
            const data = await response.json();
            const imageUrl = data.message;

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🐶 Woof!')
                .setImage(imageUrl)
                .setFooter({ text: 'Pon Cutes' });

            if (type === 'SLASH') {
                return ctx.editReply({ embeds: [embed] });
            } else {
                return ctx.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            const errorMsg = '❌ Failed to fetch dog image. Try again later!';
            if (type === 'SLASH') {
                if (ctx.deferred) return ctx.editReply({ content: errorMsg });
                return ctx.reply({ content: errorMsg, ephemeral: true });
            }
            else return ctx.channel.send({ content: errorMsg });
        }
    }
};
