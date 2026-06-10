const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'warn',
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

        guildSettings.warns[target.id] += 1;
        const userWarns = guildSettings.warns[target.id];

        // Auto-Mute jika 3 Warn
        let actionText = `Warn (${userWarns}/3)`;
        if (userWarns >= 3) {
            actionText = `Warn (${userWarns}/3) & Auto-Mute (1 Day)`;
            await target.timeout(24 * 60 * 60 * 1000, 'Auto-Mute: Reached 3 warnings').catch(()=>{});
            const muteRole = guildSettings.muteRoleId;
            if (muteRole) await target.roles.add(muteRole).catch(()=>{});
            guildSettings.warns[target.id] = 0; 
        }

        // SIMPAN HISTORY
        guildSettings.caseCount = (guildSettings.caseCount || 0) + 1;
        const caseId = guildSettings.caseCount.toString().padStart(6, '0');

        guildSettings.history[target.id].push({
            caseId: caseId,
            action: actionText,
            reason: reason,
            staffId: staff.id,
            timestamp: Date.now()
        });

        // Simpan Asinkron
        fs.writeFile(SETTINGS_FILE, JSON.stringify(ctx.client.databaseCache, null, 2), (err) => {});

        const replyMsg = `✅ **${target.user.tag}** warned (${userWarns}/3). Reason: ${reason}`;
        if (ctx.commandName) {
            await ctx.reply({ content: replyMsg });
            setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
        } else {
            const msg = await ctx.reply(replyMsg);
            setTimeout(() => msg.delete().catch(()=>{}), 5000);
        }

        // 🚀 SOLUSI ANTI NYASAR (Diperbarui)
        let logChannel = null;
        const logChanId = guildSettings.modLogChannelId;
        
        if (logChanId) {
            logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
        } else {
            // Jika ID gagal dilacak, hanya cari nama yang EXACT sama (BUKAN .includes)
            logChannel = ctx.guild.channels.cache.find(c => c.name === 'moderation-logs' || c.name === 'mod-logs');
        }

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setAuthor({name: `Mod Action | ${target.user.username}`})
                .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\n${actionText}\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                .setTimestamp();
            await logChannel.send({embeds: [embed]}).catch(()=>{});
        }
    }
};