const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Send an official announcement to a channel (Admin Only).',

    // ==========================================
    // 1. PREFIX COMMAND (pon announce ...)
    // ==========================================
    async executePrefix(message, args) {
        const p = 'pon'; // Prefix

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **Access Denied:** You do not have the Administrator permission required to use this command.' });
        }

        const targetChannel = message.mentions.channels.first();
        if (!targetChannel) {
            return message.reply({ content: `**Usage:** \`${p} announce [#channel] [Title] | [Message] | [@ping]\`\n*Tip: Upload 1 image for the main picture, or upload 2 images at once (1st = Main Image, 2nd = Thumbnail).*` });
        }

        const commandRegex = new RegExp(`^${p}\\s+announce\\s+<#\\d+>\\s*`, 'i');
        const rawText = message.content.replace(commandRegex, '');

        if (!rawText && message.attachments.size === 0) {
            return message.reply({ content: '❌ You must provide text or attach an image to make an announcement.' });
        }

        let titleText = null;
        let descText = rawText;
        let pingText = null;

        if (rawText.includes('|')) {
            const parts = rawText.split('|');
            titleText = parts[0] ? parts[0].trim() : null;
            descText = parts[1] ? parts[1].trim() : null; // Ubah ke null jika kosong
            pingText = parts[2] ? parts[2].trim() : null;
        }

        const attachments = Array.from(message.attachments.values());
        const imageUrl = attachments.length > 0 ? attachments[0].url : null;
        const thumbnailUrl = attachments.length > 1 ? attachments[1].url : null;

        // Bikin embed TANPA waktu (timestamp) di bawahnya
        const embed = new EmbedBuilder()
            .setColor('#2F3136');

        if (titleText) embed.setTitle(titleText);
        if (descText) embed.setDescription(descText);
        if (imageUrl) embed.setImage(imageUrl);
        if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

        try {
            await targetChannel.send({ content: pingText ? pingText : undefined, embeds: [embed] });
            return message.reply({ content: `✅ **Success!** Announcement has been published to ${targetChannel}.` });
        } catch (error) {
            console.error(error);
            return message.reply({ content: '❌ **Error:** Failed to send the announcement. Please ensure I have "Send Messages" and "Embed Links" permissions in that channel.' });
        }
    },

    // ==========================================
    // 2. SLASH COMMAND (/announce)
    // ==========================================
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an official announcement to a channel (Admin Only).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the announcement will be sent')
                .setRequired(true))
        // SEMUA OPTION DI BAWAH INI SEKARANG FALSE (BEBAS / OPSIONAL)
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the announcement (Optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement text (Type \\n for a new line) (Optional)')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Attach a main image for the announcement (Optional)')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('thumbnail')
                .setDescription('Attach a small thumbnail image for the top right corner (Optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Tag someone or @everyone (Optional)')
                .setRequired(false)),

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ **Access Denied:** Administrator permission required.', ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('channel');
        const titleText = interaction.options.getString('title');
        let descText = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('image');
        const thumbnail = interaction.options.getAttachment('thumbnail');
        const pingText = interaction.options.getString('ping');

        // Validasi Anti-Kosong Mutlak
        if (!titleText && !descText && !attachment && !thumbnail) {
            return interaction.reply({ content: '❌ **Error:** You cannot send a completely empty announcement. Please provide at least a title, message, or an image.', ephemeral: true });
        }

        // Mencegah error code replace jika descText dikosongkan admin
        if (descText) {
            descText = descText.replace(/\\n/g, '\n');
        }

        // Bikin embed TANPA waktu (timestamp) di bawahnya
        const embed = new EmbedBuilder()
            .setColor('#2F3136');

        // Menyusun embed sesuai ketersediaan data
        if (titleText) embed.setTitle(titleText);
        if (descText) embed.setDescription(descText);
        if (attachment) embed.setImage(attachment.url);
        if (thumbnail) embed.setThumbnail(thumbnail.url);

        try {
            await targetChannel.send({ content: pingText ? pingText : undefined, embeds: [embed] });
            return interaction.reply({ content: `✅ **Success!** Announcement has been published to ${targetChannel}.`, ephemeral: true }); 
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ **Error:** Failed to send the announcement. Check my permissions in that channel.', ephemeral: true });
        }
    }
};