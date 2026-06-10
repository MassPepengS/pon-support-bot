const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

function createProgressBar(current, max, size = 15) {
    const progress = Math.round((current / max) * size);
    const safeProgress = Math.min(Math.max(progress, 0), size);
    const emptyProgress = size - safeProgress;
    return `[${'■'.repeat(safeProgress)}${'□'.repeat(emptyProgress)}]`;
}

module.exports = {
    name: 'clan',
    description: 'Choose and join an official Clan in the Outpost.',

    async executePrefix(message, args) {
        const targetUser = message.author; 
        const guildId = message.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = message.client.getProfile(guildId, targetUser.id);
        
        const currentLevel = userData.level || 1;
        const currentXP = userData.xp || 0;
        const requiredXP = currentLevel * currentLevel * 100; 
        const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
        
        const xpInCurrentLevel = currentXP - previousLevelXP;
        const xpNeededForLevelUp = requiredXP - previousLevelXP;
        const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForLevelUp, 15);

        const divider = '─────────────────────';
        let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
        
        if (userData.badges && userData.badges.length > 0) desc += `${userData.badges.join(' ')}\n${divider}\n`;
        desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;
        
        const userTag = userData.gamertag || '*Not set*';
        const clanTag = userData.clan || '*Not set*';
        const likesCount = userData.likes ? userData.likes.length : 0;
        const charismaCount = userData.charisma || 0;

        desc += `**USER INFO:**\n<:user:1509262449394716803> ${userTag}\n<:clan:1509262421423034549> ${clanTag}\n\n<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**`;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(desc);

        if (userData.album) embed.setImage(userData.album);

        const clanMenu = new StringSelectMenuBuilder()
            .setCustomId('select_clan')
            .setPlaceholder('Select your Clan here...')
            .addOptions([
                { label: 'Soul Of Begalers', description: 'Join the Soul Of Begalers division.', value: 'Soul Of Begalers', emoji: '1509262421423034549' },
                { label: 'Inflame', description: 'Join the Inflame division.', value: 'Inflame', emoji: '1509262421423034549' }
            ]);

        const row = new ActionRowBuilder().addComponents(clanMenu);
        return message.reply({ embeds: [embed], components: [row] });
    },

    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Choose and join an official Clan in the Outpost.'),

    async executeSlash(interaction) {
        const targetUser = interaction.user;
        const guildId = interaction.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const userData = interaction.client.getProfile(guildId, targetUser.id);
        
        const currentLevel = userData.level || 1;
        const currentXP = userData.xp || 0;
        const requiredXP = currentLevel * currentLevel * 100;
        const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
        
        const xpInCurrentLevel = currentXP - previousLevelXP;
        const xpNeededForLevelUp = requiredXP - previousLevelXP;
        const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForLevelUp, 15);

        const divider = '─────────────────────';
        let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
        
        if (userData.badges && userData.badges.length > 0) desc += `${userData.badges.join(' ')}\n${divider}\n`;
        desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;

        const userTag = userData.gamertag || '*Not set*';
        const clanTag = userData.clan || '*Not set*';
        const likesCount = userData.likes ? userData.likes.length : 0;
        const charismaCount = userData.charisma || 0;

        desc += `**USER INFO:**\n<:user:1509262449394716803> ${userTag}\n<:clan:1509262421423034549> ${clanTag}\n\n<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**`;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(desc);

        if (userData.album) embed.setImage(userData.album);

        const clanMenu = new StringSelectMenuBuilder()
            .setCustomId('select_clan')
            .setPlaceholder('Select your Clan here...')
            .addOptions([
                { label: 'Soul Of Begalers', description: 'Join the Soul Of Begalers division.', value: 'Soul Of Begalers', emoji: '1509262421423034549' },
                { label: 'Inflame', description: 'Join the Inflame division.', value: 'Inflame', emoji: '1509262421423034549' }
            ]);

        const row = new ActionRowBuilder().addComponents(clanMenu);
        return interaction.reply({ embeds: [embed], components: [row] });
    }
};