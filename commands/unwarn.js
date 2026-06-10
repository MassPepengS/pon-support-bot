const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'unwarn',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission!');
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a user!');
        const reason = args.slice(1).join(' ') || 'No reason';
        await this.executeAction(message, target, message.author, reason, settings, SETTINGS_FILE);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason';
        await this.executeAction(interaction, target, interaction.user, reason, settings, SETTINGS_FILE);
    },
    async executeAction(ctx, target, staff, reason, settings, SETTINGS_FILE) {
        const guildId = ctx.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const guildSettings = ctx.client.checkDatabase(guildId);
        if (!guildSettings.warns) guildSettings.warns = {};
        if (!guildSettings.warns[target.id]) guildSettings.warns[target.id] = 0;
        if (!guildSettings.history) guildSettings.history = {};
        if (!guildSettings.history[target.id]) guildSettings.history[target.id] = [];

        if (guildSettings.warns[target.id] <= 0) {
            const err = '❌ This user has no warnings to remove!';
            if (ctx.commandName) return ctx.reply({content: err, ephemeral: true}); else return ctx.reply(err);
        }

        // Kurangi jumlah warn
        guildSettings.warns[target.id] -= 1;
        const userWarns = guildSettings.warns[target.id];

        // 🚀 SISTEM UNDO: Hapus riwayat warn terakhir dari history
        if (guildSettings.history[target.id].length > 0) {
            guildSettings.history[target.id].pop(); // Menarik kembali catatan terakhir
        }
        
        // Jika warn habis (0), pastikan history bersih total
        if (userWarns === 0) {
            guildSettings.history[target.id] = [];
        }

        // Update Case Count untuk Log Mod (Laporan ke Channel Log Tetap Jalan)
        guildSettings.caseCount = (guildSettings.caseCount || 0) + 1;
        const caseId = guildSettings.caseCount.toString().padStart(6, '0');

        // Simpan Asinkron
        fs.writeFile(SETTINGS_FILE, JSON.stringify(ctx.client.databaseCache, null, 2), (err) => {});
        
        const replyMsg = `✅ **${target.user.tag}** unwarned (Warns left: ${userWarns}/3). Reason: ${reason}`;
        
        if (ctx.commandName) {
            await ctx.reply({ content: replyMsg });
            setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
        } else {
            const msg = await ctx.reply(replyMsg);
            setTimeout(() => msg.delete().catch(()=>{}), 5000);
        }

        // 🚀 LOG KE CHANNEL MODERATION-LOGS (TIDAK MASUK HISTORY PLAYER)
        let logChannel = null;
        const logChanId = guildSettings.modLogChannelId;
        
        if (logChanId) {
            logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
        } else {
            // Pencarian nama pasti
            logChannel = ctx.guild.channels.cache.find(c => c.name === 'moderation-logs' || c.name === 'mod-logs');
        }

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71') // Hijau tanda pengampunan
                .setAuthor({name: `Mod Action | ${target.user.username}`})
                .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nUnwarn (${userWarns}/3)\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                .setTimestamp();
            await logChannel.send({embeds: [embed]}).catch(()=>{});
        }
    }
};