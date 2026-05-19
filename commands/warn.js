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
        let userWarns = settings[guildId].warns[target.id] || 0;
        userWarns += 1;
        settings[guildId].warns[target.id] = userWarns;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

        let replyMsg = `✅ **${target.user.tag}** warned (Warn ${userWarns}/3). Reason: ${reason}`;
        let autoMuted = false;

        if (userWarns % 3 === 0) {
            autoMuted = true;
            await target.timeout(24 * 60 * 60 * 1000, 'Auto-Mute: Reached 3 warnings').catch(()=>{});
            const muteRole = settings[guildId].muteRoleId;
            if (muteRole) await target.roles.add(muteRole).catch(()=>{});
            replyMsg += `\n🚨 **3 Warns Reached!** User has been auto-muted for 1 Day.`;
        }

        if (ctx.commandName) await ctx.reply(replyMsg); else await ctx.reply(replyMsg);

        let logChannel = null;
        const logChanId = settings[guildId]?.modLogChannelId;
        if (logChanId) logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
        else logChannel = ctx.guild.channels.cache.find(c => c.name.toLowerCase().includes('mod'));

        if (logChannel) {
            // GENERATE CASE ID
            let caseId = "000000";
            try {
                let db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
                db[guildId].caseCount = (db[guildId].caseCount || 0) + 1;
                fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));
                caseId = db[guildId].caseCount.toString().padStart(6, '0');
            } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

            // FORMAT EMBED
            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setAuthor({name: `Mod Action | ${target.user.username}`})
                .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nWarn (${userWarns}/3)${autoMuted ? ' + Auto-Mute (1d)' : ''}\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                .setTimestamp();
            await logChannel.send({embeds: [embed]}).catch(()=>{});
        }
    }
};
