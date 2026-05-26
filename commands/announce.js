const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Send an official announcement to a channel (Admin Only).',

    // ==========================================
    // 1. PREFIX COMMAND (pon announce ...)
    // ==========================================
    async executePrefix(message, args) {
        const p = 'pon'; // Prefix

        // 1. Verifikasi Izin Admin (Security Check)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **Access Denied:** You do not have the Administrator permission required to use this command.' });
        }

        // 2. Validasi Target Channel
        const targetChannel = message.mentions.channels.first();
        if (!targetChannel) {
            return message.reply({ content: `**Usage:** \`${p} announce [#channel] [Title] | [Message]\`\n*Tip: Use the | symbol to separate the title from the message. You can also attach an image directly!*` });
        }

        // 3. Ekstrak Teks Pengumuman
        const commandRegex = new RegExp(`^${p}\\s+announce\\s+<#\\d+>\\s*`, 'i');
        const rawText = message.content.replace(commandRegex, '');

        if (!rawText && message.attachments.size === 0) {
            return message.reply({ content: '❌ You must provide text or attach an image to make an announcement.' });
        }

        // 4. Memisahkan Judul dan Pesan menggunakan simbol "|"
        let titleText = null;
        let descText = rawText;

        if (rawText.includes('|')) {
            const parts = rawText.split('|');
            titleText = parts[0].trim();
            descText = parts.slice(1).join('|').trim();
        }

        // 5. Ambil Lampiran Gambar (Jika ada)
        const attachment = message.attachments.first();
        const imageUrl = attachment ? attachment.url : null;

        // 6. Rakit Embed Bersih & Minimalis (SOP #3) + Footer (Sesuai Permintaan)
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setFooter({ text: `Published by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        if (titleText) embed.setTitle(titleText);
        if (descText) embed.setDescription(descText);
        if (imageUrl) embed.setImage(imageUrl);

        // 7. Eksekusi Pengiriman
        try {
            await targetChannel.send({ embeds: [embed] });
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
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement text (Type \\n for a new line/enter)')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Attach an image for the announcement (Optional)')
                .setRequired(false)),

    async executeSlash(interaction) {
        // 1. Verifikasi Izin
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ **Access Denied:** Administrator permission required.', ephemeral: true });
        }

        // 2. Ambil Data dari Form Slash Command
        const targetChannel = interaction.options.getChannel('channel');
        const titleText = interaction.options.getString('title');
        let descText = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('image');

        // Mengubah kode \n yang diketik manual menjadi 'Enter' (Baris Baru) yang asli
        descText = descText.replace(/\\n/g, '\n');

        // 3. Rakit Embed Bersih & Minimalis (SOP #3) + Footer (Sesuai Permintaan)
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle(titleText)
            .setDescription(descText)
            .setFooter({ text: `Published by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        // Pasang gambar jika ada
        if (attachment) {
            embed.setImage(attachment.url);
        }

        // 4. Eksekusi Pengiriman
        try {
            await targetChannel.send({ embeds: [embed] });
            return interaction.reply({ content: `✅ **Success!** Announcement has been published to ${targetChannel}.`, ephemeral: true }); 
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ **Error:** Failed to send the announcement. Check my permissions in that channel.', ephemeral: true });
        }
    }
};
