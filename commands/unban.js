const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'unban',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission!');
        const userId = args[0];
        if (!userId) return message.reply('❌ Please provide a User ID! Example: `pon unban 123456789012345678`');
        const reason = args.slice(1).join(' ') || 'No reason';
        await this.executeAction(message, userId, message.author, reason, settings, SETTINGS_FILE);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason';
        await this.executeAction(interaction, userId, interaction.user, reason, settings, SETTINGS_FILE);
    },
    async executeAction(ctx, userId, staff, reason, settings, SETTINGS_FILE) {
        try {
            const guild = ctx.guild || ctx.member.guild;
            // Mengeksekusi unban dari server
            const unbannedUser = await guild.members.unban(userId, reason);
            
            const replyMsg = `✅ **${unbannedUser.tag || userId}** has been Unbanned. Reason: ${reason}`;
            
            // PESAN HILANG 5 DETIK
            if (ctx.commandName) {
                await ctx.reply({ content: replyMsg });
                setTimeout(() => ctx.deleteReply().catch(()=>{}), 5000);
            } else {
                const msg = await ctx.reply(replyMsg);
                setTimeout(() => msg.delete().catch(()=>{}), 5000);
            }

            let logChannel = null;
            const logChanId = settings[guild.id]?.modLogChannelId;
            if (logChanId) logChannel = guild.channels.cache.get(logChanId) || await guild.channels.fetch(logChanId).catch(() => null);
            else logChannel = guild.channels.cache.find(c => c.name.toLowerCase().includes('mod'));

            if (logChannel) {
                let caseId = "000000";
                try {
                    let db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
                    if (!db[guild.id]) db[guild.id] = {};
                    db[guild.id].caseCount = (db[guild.id].caseCount || 0) + 1;
                    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));
                    caseId = db[guild.id].caseCount.toString().padStart(6, '0');
                } catch (err) { caseId = "ERR" + Math.floor(Math.random() * 1000); }

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71') // Warna hijau untuk Unban
                    .setAuthor({name: `Mod Action | Unban`})
                    .setDescription(`**USER ID**\n${userId}\n**STAFF**\n<@${staff.id}>\n**ACTION**\nUnban\n**REASON**\n${reason}\n\n**CASE ID:** ${caseId}`)
                    .setTimestamp();
                await logChannel.send({embeds: [embed]}).catch(()=>{});
            }
        } catch (e) {
            const err = '❌ Error. Make sure the User ID is correct and the user is actually banned!';
            if (ctx.commandName) ctx.reply({content: err, ephemeral: true}); else ctx.reply(err);
        }
    }
};
