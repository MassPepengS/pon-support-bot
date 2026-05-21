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
    name: 'tempban',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission!');
        
        if (args.length < 2) return message.reply('❌ Format: `pon tempban @user 1d reason`');

        let targetUser = message.mentions.users.first();
        let targetId = targetUser ? targetUser.id : args[0].replace(/[^0-9]/g, '');
        
        if (!targetId) return message.reply('❌ Please mention a valid user or provide their ID!');
        
        const timeArg = args[1];
        const parsedTime = parseDuration(timeArg);
        if (!parsedTime) return message.reply('❌ Invalid time format! Use `d`, `h`, `m`, `s` (e.g., `10m`, `1d`).\nFormat: `pon tempban @user 10m reason`');

        const reason = args.slice(2).join(' ') || 'No reason';
        await this.executeAction(message, targetId, message.author, parsedTime.ms, parsedTime.text, reason, settings, SETTINGS_FILE, targetUser);
    },
    
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        const targetUser = interaction.options.getUser('user');
        const timeArg = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason';

        const parsedTime = parseDuration(timeArg);
        if (!parsedTime) return interaction.reply({content: '❌ Invalid time format!', ephemeral: true});

        await this.executeAction(interaction, targetUser.id, interaction.user, parsedTime.ms, parsedTime.text, reason, settings, SETTINGS_FILE, targetUser);
    },
    
    async executeAction(ctx, targetId, staff, durationMs, durationText, reason, settings, SETTINGS_FILE, targetObj) {
        try {
            const guild = ctx.guild;
            
            // Eksekusi ban di server
            await guild.members.ban(targetId, { reason: `Tempban by ${staff.username}: ${reason}` });

            // Simpan ke database untuk Auto-Unban di events/ready.js
            let db = {};
            try { db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { db = {}; }
            if (!db[guild.id]) db[guild.id] = {};
            if (!db[guild.id].tempbans) db[guild.id].tempbans = [];

            const unbanTime = Date.now() + durationMs;
            db[guild.id].tempbans.push({
                userId: targetId,
                unbanAt: unbanTime
            });
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));

            const targetName = targetObj ? targetObj.username : targetId;
            const replyMsg = `✅ **${targetName}** has been Temp-Banned for **${durationText}**. Reason: ${reason}`;
            
            if (ctx.commandName) {
                await ctx.reply({ content: replyMsg });
                setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
            } else {
                const msg = await ctx.reply(replyMsg);
                setTimeout(() => msg.delete().catch(()=>{}), 5000);
            }

            // MOD LOG
            let logChannel = null;
            const logChanId = db[guild.id]?.modLogChannelId || settings[guild.id]?.modLogChannelId;
            if (logChanId) logChannel = guild.channels.cache.get(logChanId) || await guild.channels.fetch(logChanId).catch(() => null);
            else logChannel = guild.channels.cache.find(c => c.name.toLowerCase().includes('mod'));

            if (logChannel) {
                db[guild.id].caseCount = (db[guild.id].caseCount || 0) + 1;
                fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));
                const caseId = db[guild.id].caseCount.toString().padStart(6, '0');

                const embed = new EmbedBuilder()
                    .setColor('#992D22') // Merah tua
                    .setAuthor({name: `Mod Action | Tempban`})
                    .setDescription(`**USER**\n<@${targetId}>\n**STAFF**\n<@${staff.id}>\n**ACTION**\nTempban (${durationText})\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                    .setTimestamp();
                await logChannel.send({embeds: [embed]}).catch(()=>{});
            }
        } catch (e) {
            console.error(e);
            const err = '❌ Error: I cannot ban this user (they might have a higher role than me, or I lack permissions)!';
            if (ctx.commandName) await ctx.reply({content: err, ephemeral: true}).catch(()=>{}); 
            else await ctx.reply(err).catch(()=>{});
        }
    }
};
