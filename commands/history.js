const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'history',
    async executePrefix(message, args, SETTINGS_FILE, settings) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission!');
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        await this.executeAction(message, target, message.author, settings, SETTINGS_FILE);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({content: '❌ No permission!', ephemeral: true});
        const target = interaction.options.getMember('user') || interaction.member;
        await this.executeAction(interaction, target, interaction.user, settings, SETTINGS_FILE);
    },
    async executeAction(ctx, target, staff, settings, SETTINGS_FILE) {
        const guildId = ctx.guild.id;
        
        let db = {};
        try { db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { db = {}; }
        if (!db[guildId]) db[guildId] = {};
        
        const userWarns = db[guildId].warns?.[target.id] || 0;
        const userHistory = db[guildId].history?.[target.id] || [];

        const embed = new EmbedBuilder()
            .setColor('#2F3136') // <-- Dikembalikan ke warna "Invisible" / Tidak Berwarna
            .setAuthor({ name: `Modlog History | ${target.user.username}`, iconURL: target.user.displayAvatarURL() })
            .setTimestamp();

        if (userHistory.length === 0) {
            embed.setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n\n**CURRENT WARNINGS**\n${userWarns}/3\n\n**RECORDS**\nClean record! No prior historical infractions found.`);
        } else {
            // Menampilkan hingga 10 riwayat kasus terakhir agar rapi
            const fields = userHistory.slice(-10).reverse().map((cases) => {
                return `🆔 **CASE ID:** ${cases.caseId || 'UNKNOWN'}\n🛠️ **Action:** ${cases.action}\n👤 **Staff:** <@${cases.staffId}>\n📝 **Reason:** ${cases.reason}\n📅 **Date:** <t:${Math.floor(cases.timestamp / 1000)}:F>`;
            }).join('\n\n───────────────────\n\n');
            
            embed.setDescription(`**USER**\n<@${target.id}> | ${target.user.username}\n\n**CURRENT WARNINGS**\n${userWarns}/3\n\n**RECORDS**\n${fields}`);
        }

        return ctx.reply({ embeds: [embed] });
    }
};
