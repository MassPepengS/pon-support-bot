const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    async executePrefix(message, args) {
        return this.sendAvatar(message, 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.sendAvatar(interaction, 'SLASH');
    },

    async sendAvatar(ctx, type) {
        // Mendapatkan user yang di-mention atau pengirim pesan
        const user = type === 'SLASH' 
            ? ctx.options.getUser('user') || ctx.user 
            : (ctx.mentions.users.first() || ctx.author);

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle(`🖼️ Avatar: ${user.username}`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Requested by ${type === 'SLASH' ? ctx.user.tag : ctx.author.tag}` })
            .setTimestamp();

        if (type === 'SLASH') {
            return ctx.reply({ embeds: [embed] });
        } else {
            return ctx.channel.send({ embeds: [embed] });
        }
    }
};
