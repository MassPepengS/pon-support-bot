const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'unmute',
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
        try {
            // Cabut timeout (set jadi null)
            await target.timeout(null, reason);
            
            // Cabut role muted (jika ada)
            const guildId = ctx.guild.id;
            const muteRole = settings[guildId]?.muteRoleId;
            if (muteRole) await target.roles.remove(muteRole).catch(()=>{});

            const replyMsg = `✅ **${target.user.tag}** has been Unmuted. Reason: ${reason}`;
            
            if (ctx.commandName) {
                await ctx.reply({ content: replyMsg });
                setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
            } else {
                const msg = await ctx.reply(replyMsg);
                setTimeout(() => msg.delete().catch(()=>{}), 5000);
            }

            let logChannel = null;
            const logChanId = settings[guildId]?.modLogChannelId;
            if (logChanId) logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
            else logChannel = ctx.guild.channels.cache.find(c => c.name.toLowerCase().includes('mod'));

            if (logChannel) {
                let caseId = "000000";
                try {
                    let db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
                    if (!db[guildId]) db[guildId] = {};
                    db[guildId].caseCount = (db[guildId].caseCount || 0) + 1;
                    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));
                    caseId = db[guildId].caseCount.toString().padStart(6, '0');
                } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71') // Hijau tanda pengampunan
                    .setAuthor({name: `Mod Action | ${target.user.username}`})
                    .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nUnmute\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                    .setTimestamp();
                await logChannel.send({embeds: [embed]}).catch(()=>{});
            }
        } catch (e) {
            const err = '❌ Error. Check my role hierarchy!';
            if (ctx.commandName) ctx.reply({content: err, ephemeral: true}); else ctx.reply(err);
        }
    }
};
