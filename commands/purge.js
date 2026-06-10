const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'purge',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission!');
        
        let targetUser = message.mentions.users.first();
        let filterType = null;
        let amount = 10;

        if (args[0] === 'links') {
            filterType = 'links';
            amount = parseInt(args[1]) || 10;
        } else if (targetUser) {
            amount = parseInt(args[1]) || 10;
        } else {
            amount = parseInt(args[0]) || 10;
        }

        if (amount > 100) amount = 100;
        if (amount < 1) amount = 1;

        await this.executeAction(message, amount, targetUser, filterType, settings, SETTINGS_FILE);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const filterType = interaction.options.getString('filter');

        await this.executeAction(interaction, amount, targetUser, filterType, settings, SETTINGS_FILE);
    },
    async executeAction(ctx, amount, targetUser, filterType, settings, SETTINGS_FILE) {
        try {
            const channel = ctx.channel;
            const guildId = ctx.guild.id;

            let messages = await channel.messages.fetch({ limit: 100 });

            // 🚨 KUNCI PERBAIKAN: Sembunyikan pesan perintah dari perhitungan kuota!
            if (!ctx.commandName) {
                messages = messages.filter(m => m.id !== ctx.id);
            }

            if (targetUser) {
                messages = messages.filter(m => m.author.id === targetUser.id);
            } else if (filterType === 'links') {
                const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+)/gi;
                messages = messages.filter(m => linkRegex.test(m.content));
            }

            const toDelete = Array.from(messages.values()).slice(0, amount);

            if (toDelete.length === 0) {
                const noMsg = '❌ No matching messages found!';
                if (ctx.commandName) return ctx.reply({ content: noMsg, ephemeral: true });
                else return ctx.channel.send(noMsg).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));
            }

            const deleted = await channel.bulkDelete(toDelete, true);
            
            let filterText = 'Generic';
            if (targetUser) filterText = `User (@${targetUser.username})`;
            if (filterType === 'links') filterText = 'Links Only';

            const replyMsg = `✅ Successfully purged **${deleted.size}** messages. (Filter: ${filterText})`;

            if (ctx.commandName) {
                await ctx.reply({ content: replyMsg, ephemeral: true });
            } else {
                await ctx.delete().catch(()=>{}); // Menghapus pesan command secara terpisah
                const msg = await ctx.channel.send(replyMsg);
                setTimeout(() => msg.delete().catch(()=>{}), 5000);
            }

            // MOD LOG SYSTEM
            // 🚀 BACA DARI MESIN RAM SETTINGS
            const guildSettings = ctx.client.checkDatabase(guildId);

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
                guildSettings.caseCount = (guildSettings.caseCount || 0) + 1;
                
                fs.writeFile(SETTINGS_FILE, JSON.stringify(ctx.client.databaseCache, null, 2), (err) => {
                    if (err) console.error("Gagal save caseCount Purge:", err);
                });
                const caseId = guildSettings.caseCount.toString().padStart(6, '0');

                const staff = ctx.user || ctx.author;

                const embed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setAuthor({ name: `Mod Action | Advanced Purge` })
                    .setDescription(`**CHANNEL**\n<#${channel.id}>\n**STAFF**\n<@${staff.id}>\n**ACTION**\nPurge (${deleted.size} messages)\n**FILTER TYPE**\n${filterText}\n\n**CASE ID:** ${caseId}`)
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] }).catch(()=>{});
            }

        } catch (e) {
            console.error(e);
            const err = '❌ Error executing purge! (Discord prevents bulk deleting messages older than 14 days)';
            if (ctx.commandName) ctx.reply({ content: err, ephemeral: true }).catch(()=>{});
            else ctx.channel.send(err).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000)).catch(()=>{});
        }
    }
};