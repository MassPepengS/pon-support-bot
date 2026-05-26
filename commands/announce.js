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
            return message.reply({ content: `**Usage:** \`${p} announce [#channel] [your message]\`\n*Tip: You can also attach an image directly to your message!*` });
        }

        // 3. Ekstrak Teks Pengumuman
        // Menghapus kata "pon announce #channel" dari pesan untuk mengambil teks murninya
        const commandRegex = new RegExp(`^${p}\\s+announce\\s+<#\\d+>\\s*`, 'i');
        const announcementText = message.content.replace(commandRegex, '');

        if (!announcementText && message.attachments.size === 0) {
            return message.reply({ content: '❌ You must provide text or attach an image to make an announcement.' });
        }

        // 4. Ambil Lampiran Gambar (Jika ada)
        const attachment = message.attachments.first();
        const imageUrl = attachment ? attachment.url : null;

        // 5. Rakit Embed Bergaya Iris Bot
        const embed = new EmbedBuilder()
            .setColor('#2F3136') // Warna Cyan/Biru Muda (Persis seperti Iris Bot)
            .setAuthor({ name: `${message.guild.name} Official Announcement`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setDescription(announcementText || null)
            .setTimestamp()
            .setFooter({ text: `Published by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        // Jika Admin melampirkan gambar, pasang gambarnya di embed
        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        // 6. Eksekusi Pengiriman
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
        let announcementText = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('image');

        // Mengubah kode \n yang diketik manual menjadi 'Enter' (Baris Baru) yang asli
        announcementText = announcementText.replace(/\\n/g, '\n');

        // 3. Rakit Embed Bergaya Iris Bot
        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setAuthor({ name: `${interaction.guild.name} Official Announcement`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(announcementText)
            .setTimestamp()
            .setFooter({ text: `Published by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        // Pasang gambar jika ada
        if (attachment) {
            embed.setImage(attachment.url);
        }

        // 4. Eksekusi Pengiriman
        try {
            await targetChannel.send({ embeds: [embed] });
            return interaction.reply({ content: `✅ **Success!** Announcement has been published to ${targetChannel}.`, ephemeral: true }); // Ephemeral = Hanya admin yg liat konfirmasinya
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ **Error:** Failed to send the announcement. Check my permissions in that channel.', ephemeral: true });
        }
    }
};
