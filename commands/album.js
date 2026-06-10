const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'album',
    description: 'Set a custom image/screenshot for your profile album.',

    async executePrefix(message, args) {
        const attachment = message.attachments.first();
        if (!attachment) {
            return message.reply('❌ **Usage:** `pon album`\n*(You must attach an image to your message!)*');
        }

        const guildId = message.guild.id;
        const userId = message.author.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = message.client.getProfile(guildId, userId);
        userData.album = attachment.url;
        message.client.saveProfile();

        return message.reply(`✅ **Album Updated!** Your custom image has been mounted to your profile.`);
    },

    data: new SlashCommandBuilder()
        .setName('album')
        .setDescription('Set a custom image for your profile album.')
        .addAttachmentOption(opt => opt.setName('image').setDescription('Upload an image/screenshot').setRequired(true)),

    async executeSlash(interaction) {
        const attachment = interaction.options.getAttachment('image');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = interaction.client.getProfile(guildId, userId);
        userData.album = attachment.url;
        interaction.client.saveProfile();

        return interaction.reply({ content: `✅ **Album Updated!** Your custom image has been mounted to your profile.`, ephemeral: true });
    }
};