const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'clearwarn',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission!');
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a user! Example: `pon clearwarn @user`');
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
        
        // 🚀 BACA DARI MESIN RAM MUTLAK
        const guildSettings = ctx.client.checkDatabase(guildId);
        if (!guildSettings.warns) guildSettings.warns = {};
        if (!guildSettings.history) guildSettings.history = {};

        // 1. Reset Warns ke 0 & PEMUSNAHAN HISTORY TOTAL
        guildSettings.warns[target.id] = 0;
        guildSettings.history[target.id] = []; 

        // Update Case Count untuk Log
        guildSettings.caseCount = (guildSettings.caseCount || 0) + 1;
        const caseId = guildSettings.caseCount.toString().padStart(6, '0');

        // Simpan Asinkron ke Hardisk (Anti-Lag)
        fs.writeFile(SETTINGS_FILE, JSON.stringify(ctx.client.databaseCache, null, 2), (err) => {});

        // 2. Cabut Timeout/Mute secara paksa
        await target.timeout(null, 'Warns cleared').catch(()=>{});

        // 3. Cabut Mute Role jika ada
        const muteRole = guildSettings.muteRoleId;
        if (muteRole) await target.roles.remove(muteRole).catch(()=>{});

        const replyMsg = `✅ **${target.user.tag}** warnings cleared (0/3) & Auto-Mute lifted. Reason: ${reason}`;
        
        if (ctx.commandName) {
            await ctx.reply({ content: replyMsg });
            setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
        } else {
            const msg = await ctx.reply(replyMsg);
            setTimeout(() => msg.delete().catch(()=>{}), 5000);
        }

        // 🚀 SOLUSI ANTI NYASAR
        let logChannel = null;
        const logChanId = guildSettings.modLogChannelId;
        
        if (logChanId) {
            logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
        } else {
            // Pencarian nama pasti, bukan .includes()
            logChannel = ctx.guild.channels.cache.find(c => c.name === 'moderation-logs' || c.name === 'mod-logs');
        }

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71') // Warna Hijau Pengampunan
                .setAuthor({name: `Mod Action | ${target.user.username}`})
                .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nClear Warns (0/3) & Lift Mute\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                .setTimestamp();
            await logChannel.send({embeds: [embed]}).catch(()=>{});
        }
    }
};