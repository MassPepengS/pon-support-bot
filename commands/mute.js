const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

function parseDuration(timeStr) {
    if (!timeStr) return null;
    const regex = /^(\d+)([dhms])$/i;
    const match = timeStr.match(regex);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    let ms = 0;
    switch(unit) {
        case 'd': ms = value * 24 * 60 * 60 * 1000; break;
        case 'h': ms = value * 60 * 60 * 1000; break;
        case 'm': ms = value * 60 * 1000; break;
        case 's': ms = value * 1000; break;
    }
    return { ms, text: `${value}${unit}` };
}

module.exports = {
    name: 'mute',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission!');
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a user! Example: `pon mute @user 1d spam`');
        
        const timeArg = args[1];
        const parsedTime = parseDuration(timeArg);
        if (!parsedTime) return message.reply('❌ Invalid time format! Use `d`, `h`, `m`, `s`.');

        const reason = args.slice(2).join(' ') || 'No reason';
        await this.executeAction(message, target, message.author, parsedTime.ms, parsedTime.text, reason, settings, SETTINGS_FILE);
    },
    
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        const target = interaction.options.getMember('user');
        const timeArg = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason';

        const parsedTime = parseDuration(timeArg);
        if (!parsedTime) return interaction.reply({content: '❌ Invalid time format!', ephemeral: true});

        await this.executeAction(interaction, target, interaction.user, parsedTime.ms, parsedTime.text, reason, settings, SETTINGS_FILE);
    },
    
    async executeAction(ctx, target, staff, durationMs, durationText, reason, settings, SETTINGS_FILE) {
        try {
            if (durationMs > 28 * 24 * 60 * 60 * 1000) {
                const errMax = '❌ Timeout duration cannot exceed 28 days!';
                if (ctx.commandName) return ctx.reply({content: errMax, ephemeral: true}); else return ctx.reply(errMax);
            }

            await target.timeout(durationMs, reason);
            const muteRole = settings[ctx.guild.id]?.muteRoleId;
            if (muteRole) await target.roles.add(muteRole).catch(()=>{});

            // PESAN HILANG DALAM 5 DETIK
            const replyMsg = `✅ **${target.user.tag}** has been Muted for **${durationText}**. Reason: ${reason}`;
            if (ctx.commandName) {
                await ctx.reply({ content: replyMsg });
                setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
            } else {
                const msg = await ctx.reply(replyMsg);
                setTimeout(() => msg.delete().catch(()=>{}), 5000);
            }

            let logChannel = null;
            const logChanId = settings[ctx.guild.id]?.modLogChannelId;
            if (logChanId) logChannel = ctx.guild.channels.cache.get(logChanId) || await ctx.guild.channels.fetch(logChanId).catch(() => null);
            else logChannel = ctx.guild.channels.cache.find(c => c.name.toLowerCase().includes('mod'));

            if (logChannel) {
                let caseId = "000000";
                try {
                    let db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
                    if (!db[ctx.guild.id]) db[ctx.guild.id] = {};
                    db[ctx.guild.id].caseCount = (db[ctx.guild.id].caseCount || 0) + 1;
                    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));
                    caseId = db[ctx.guild.id].caseCount.toString().padStart(6, '0');
                } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setAuthor({name: `Mod Action | ${target.user.username}`})
                    .setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nMute (${durationText})\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                    .setTimestamp();
                await logChannel.send({embeds: [embed]}).catch(()=>{});
            }
        } catch (e) {
            const err = '❌ Error. Check my role hierarchy!';
            if (ctx.commandName) ctx.reply({content: err, ephemeral: true}); else ctx.reply(err);
        }
    }
};
