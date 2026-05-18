const { EmbedBuilder } = require('discord.js');
const { saveSettings } = require('../../utils/database');

module.exports = {
    name: 'warn',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        
        // Proteksi: Hanya Admin / Staff yang bisa memakai command ini
        if (!isRealAdmin && !isCustomAdmin) {
            return message.reply("❌ You don't have permission to use this command.");
        }

        // Target user (Mentions)
        const target = message.mentions.members.first();
        if (!target) {
            return message.reply("❌ Please mention a user to warn. Usage: `pon warn @user [reason]`");
        }

        // Alasan
        const reason = args.slice(1).join(' ') || 'No reason provided';

        return this.handleWarn(message, target, reason, SETTINGS_FILE, settings, 'PREFIX');
    },

    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        if (!isRealAdmin && !isCustomAdmin) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const target = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        return this.handleWarn(interaction, target, reason, SETTINGS_FILE, settings, 'SLASH');
    },

    async handleWarn(ctx, target, reason, SETTINGS_FILE, settings, type) {
        const isSlash = type === 'SLASH';
        const guild = ctx.guild;
        const guildId = guild.id;
        const staff = isSlash ? ctx.user : ctx.author;
        const targetId = target.id;

        // Inisialisasi struktur data di settings jika belum ada
        if (!settings[guildId].warns) settings[guildId].warns = {};
        if (!settings[guildId].caseCount) settings[guildId].caseCount = 0;

        // Tambah warn count
        if (!settings[guildId].warns[targetId]) settings[guildId].warns[targetId] = 0;
        settings[guildId].warns[targetId] += 1;
        const warnCount = settings[guildId].warns[targetId];

        // Tambah case ID global untuk server ini
        settings[guildId].caseCount += 1;
        const caseIdRaw = settings[guildId].caseCount;
        const caseId = caseIdRaw.toString().padStart(6, '0'); // Format: 000284

        // Logika Auto-Punishment (3x Warn = Mute 3 Hari)
        let autoPunishment = 'N/A';
        if (warnCount >= 3) {
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
            try {
                // Timeout user (pastikan role bot di atas role user)
                await target.timeout(threeDaysInMs, 'Reached 3 warnings');
                autoPunishment = 'Muted for 3 Days';
                
                // (Opsional) Reset warn jika sudah kena mute:
                // settings[guildId].warns[targetId] = 0;
            } catch (error) {
                console.error("Gagal mute user:", error);
                autoPunishment = 'Failed to Mute (Check bot permissions/role hierarchy)';
            }
        }

        // Simpan data ke serverSettings.json
        saveSettings(settings);

        // Format Tanggal (MM/DD/YYYY h:mm AM/PM - persis seperti gambar)
        const now = new Date();
        const dateOptions = { month: '2-digit', day: '2-digit', year: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const dateStr = `${now.toLocaleDateString('en-US', dateOptions)} ${now.toLocaleTimeString('en-US', timeOptions)}`;

        // Buat Embed Moderation Log persis dengan gambar
        const logEmbed = new EmbedBuilder()
            .setColor('#ED4245') // Garis pinggir merah
            .setAuthor({ name: `${target.user.username} | Warn`, iconURL: target.user.displayAvatarURL() })
            .setDescription(
                `Warn Count: ${warnCount}\n` +
                `Auto Punishment: ${autoPunishment}\n\n` +
                `**USER**\n${target} | ${target.user.username}\n` +
                `**STAFF**\n${staff} | ${staff.username}\n` +
                `**REASON**\n${reason}\n\n` +
                `CASE ID: ${caseId} | ${dateStr}`
            );

        // Cari Channel Log (Pertama cek database logChannelId, jika tidak ada cari manual nama channelnya)
        let logChannel;
        if (settings[guildId].logChannelId) {
            logChannel = guild.channels.cache.get(settings[guildId].logChannelId);
        }
        
        // Jika admin belum set channel log, bot akan otomatis mencari channel bernama "haven-moderation"
        if (!logChannel) {
            logChannel = guild.channels.cache.find(c => c.name === 'haven-moderation' || c.name === 'mod-logs');
        }

        // Kirim ke Channel Log
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
        }

        // Kirim respon sukses
        if (isSlash) {
            return ctx.reply({ content: `✅ Successfully warned **${target.user.tag}**.`, ephemeral: true });
        } else {
            const replyMsg = await ctx.reply(`✅ Successfully warned **${target.user.tag}**.`);
            setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
            await ctx.delete().catch(() => {});
        }
    }
};
