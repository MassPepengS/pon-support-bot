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
            // Mengambil gambar dari API gratis Dog.ceo
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            const imageUrl = data.message;

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🐶 Woof!')
                .setImage(imageUrl)
                .setFooter({ text: 'Pon Cutes' });

            if (type === 'SLASH') {
                return ctx.reply({ embeds: [embed] });
            } else {
                return ctx.channel.send({ embeds: [embed] }); // Mengirim pesan biasa tanpa reply
            }
        } catch (error) {
            console.error(error);
            const errorMsg = '❌ Waduh, sistem gagal menangkap gambar anjing. Coba lagi nanti wak!';
            if (type === 'SLASH') return ctx.reply({ content: errorMsg, ephemeral: true });
            else return ctx.channel.send({ content: errorMsg });
        }
    }
};
