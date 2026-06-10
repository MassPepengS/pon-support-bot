const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');

// Fungsi internal untuk menerjemahkan waktu (1m, 2h, 1d) menjadi milidetik
function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 's') return val * 1000;
    if (unit === 'm') return val * 60000;
    if (unit === 'h') return val * 3600000;
    if (unit === 'd') return val * 86400000;
    return null;
}

module.exports = {
    name: 'schedule',
    description: 'Schedule an official announcement for a later time (Admin Only).',

    // ==========================================
    // 1. PREFIX COMMAND (pon schedule ...)
    // ==========================================
    async executePrefix(message, args) {
        const p = 'pon'; 

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **Access Denied:** Administrator permission required.' });
        }

        const targetChannel = message.mentions.channels.first();
        const delayStr = args[0]; // Argument pertama harus berupa waktu (contoh: 10m, 1h)

        if (!targetChannel || !delayStr) {
            return message.reply({ content: `**Usage:** \`${p} schedule [time] [#channel] [Title] | [Message] | [@ping] | [thumb]\`\n*Time format: s (seconds), m (minutes), h (hours), d (days). Example: 12h, 30m*` });
        }

        const msDelay = parseTime(delayStr);
        if (!msDelay) {
            return message.reply({ content: '❌ **Invalid Time Format:** Please use format like `10s`, `30m`, `12h`, or `1d`.' });
        }

        const commandRegex = new RegExp(`^${p}\\s+schedule\\s+${delayStr}\\s+<#\\d+>\\s*`, 'i');
        const rawText = message.content.replace(commandRegex, '');

        if (!rawText && message.attachments.size === 0) {
            return message.reply({ content: '❌ You must provide text or attach an image to make an announcement.' });
        }

        let titleText = null;
        let descText = rawText;
        let pingText = null;
        let isThumbOnly = false;

        if (rawText.includes('|')) {
            const parts = rawText.split('|');
            titleText = parts[0] ? parts[0].trim() : null;
            descText = parts[1] ? parts[1].trim() : null;
            pingText = parts[2] ? parts[2].trim() : null;
            
            const modeText = parts[3] ? parts[3].trim().toLowerCase() : null;
            if (modeText === 'thumb' || modeText === 'thumbnail') isThumbOnly = true;
        }

        const attachments = Array.from(message.attachments.values());
        let imageUrl = null;
        let thumbnailUrl = null;

        if (attachments.length > 0) {
            if (isThumbOnly) {
                thumbnailUrl = attachments[0].url;
                imageUrl = attachments.length > 1 ? attachments[1].url : null;
            } else {
                imageUrl = attachments[0].url;
                thumbnailUrl = attachments.length > 1 ? attachments[1].url : null;
            }
        }

        // Bikin embed TANPA waktu (timestamp) di bawahnya
        const embed = new EmbedBuilder().setColor('#2F3136');
        if (titleText) embed.setTitle(titleText);
        if (descText) embed.setDescription(descText);
        if (imageUrl) embed.setImage(imageUrl);
        if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

        // Menghitung waktu target untuk ditampilkan ke Admin
        const targetDate = new Date(Date.now() + msDelay);
        const timestamp = Math.floor(targetDate.getTime() / 1000);

        await message.reply({ content: `⏳ **Announcement Scheduled!** It will be published to ${targetChannel} on <t:${timestamp}:F> (in <t:${timestamp}:R>).\n*- Warning: If the bot restarts before this time, the schedule will be canceled.*` });

        // Proses Hitung Mundur
        setTimeout(async () => {
            try {
                await targetChannel.send({ content: pingText ? pingText : undefined, embeds: [embed] });
            } catch (err) {
                console.error(`Failed to send scheduled announcement to ${targetChannel.id}:`, err);
            }
        }, msDelay);
    },

    // ==========================================
    // 2. SLASH COMMAND (/schedule)
    // ==========================================
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule an announcement for a later time (Admin Only).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('delay')
                .setDescription('Time delay (e.g., 10m, 12h, 1d)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the announcement will be sent')
                .setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('Title (Optional)').setRequired(false))
        .addStringOption(option => option.setName('message').setDescription('Message (Type \\n for enter) (Optional)').setRequired(false))
        .addAttachmentOption(option => option.setName('image').setDescription('Main image (Optional)').setRequired(false))
        .addAttachmentOption(option => option.setName('thumbnail').setDescription('Small thumbnail (Optional)').setRequired(false))
        .addStringOption(option => option.setName('ping').setDescription('Tag @everyone (Optional)').setRequired(false)),

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ **Access Denied:** Administrator permission required.', ephemeral: true });
        }

        const delayStr = interaction.options.getString('delay');
        const targetChannel = interaction.options.getChannel('channel');
        const titleText = interaction.options.getString('title');
        let descText = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('image');
        const thumbnail = interaction.options.getAttachment('thumbnail');
        const pingText = interaction.options.getString('ping');

        const msDelay = parseTime(delayStr);
        if (!msDelay) {
            return interaction.reply({ content: '❌ **Invalid Time Format:** Please use format like `10s`, `30m`, `12h`, or `1d`.', ephemeral: true });
        }

        if (!titleText && !descText && !attachment && !thumbnail) {
            return interaction.reply({ content: '❌ **Error:** You cannot schedule an empty announcement.', ephemeral: true });
        }

        if (descText) descText = descText.replace(/\\n/g, '\n');

        // Bikin embed TANPA waktu (timestamp) di bawahnya
        const embed = new EmbedBuilder().setColor('#2F3136');
        if (titleText) embed.setTitle(titleText);
        if (descText) embed.setDescription(descText);
        if (attachment) embed.setImage(attachment.url);
        if (thumbnail) embed.setThumbnail(thumbnail.url);

        const targetDate = new Date(Date.now() + msDelay);
        const timestamp = Math.floor(targetDate.getTime() / 1000);

        await interaction.reply({ content: `⏳ **Announcement Scheduled!** It will be published to ${targetChannel} on <t:${timestamp}:F> (in <t:${timestamp}:R>).\n*- Warning: If the bot restarts before this time, the schedule will be canceled.*`, ephemeral: true });

        // Proses Hitung Mundur
        setTimeout(async () => {
            try {
                await targetChannel.send({ content: pingText ? pingText : undefined, embeds: [embed] });
            } catch (error) {
                console.error(`Failed to send scheduled announcement to ${targetChannel.id}:`, error);
            }
        }, msDelay);
    }
};