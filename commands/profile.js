const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createProgressBar(current, max, size = 15) {
    const progress = Math.round((current / max) * size);
    const safeProgress = Math.min(Math.max(progress, 0), size);
    const emptyProgress = size - safeProgress;
    return `[${'■'.repeat(safeProgress)}${'□'.repeat(emptyProgress)}]`;
}

module.exports = {
    name: 'profile',
    description: 'View your or another player\'s RPG Profile.',

    async executePrefix(message, args) {
        const client = message.client; // 🚀 Akses mesin utama

        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            targetUser = await client.users.fetch(args[0]).catch(() => null);
        }
        if (!targetUser) targetUser = message.author;
        
        if (targetUser.bot) return message.reply({ content: '❌ Bots do not have an RPG profile.' });

        const guildId = message.guild.id;
        
        // 🚀 TARIK DATA LANGSUNG DARI RAM (Sangat Cepat & Otomatis membuat profil jika belum ada)
        const userData = client.getProfile(guildId, targetUser.id);

        const currentLevel = userData.level || 1;
        const currentXP = userData.xp || 0;
        const requiredXP = currentLevel * currentLevel * 100; 
        const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
        
        const xpInCurrentLevel = currentXP - previousLevelXP;
        const xpNeededForLevelUp = requiredXP - previousLevelXP;
        const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForLevelUp, 15);

        const divider = '─────────────────────';
        let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
        
        if (userData.badges && userData.badges.length > 0) {
            desc += `${userData.badges.join(' ')}\n${divider}\n`;
        }

        desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;
        
        const userTag = userData.gamertag || '*Not set*';
        const clanTag = userData.clan || '*Not set*';
        const likesCount = userData.likes ? userData.likes.length : 0;
        const charismaCount = userData.charisma || 0;

        desc += `**USER INFO:**\n`;
        desc += `<:user:1509262449394716803> ${userTag}\n`;
        desc += `<:clan:1509262421423034549> ${clanTag}\n\n`;
        desc += `<:like:1509251461719261214> **${likesCount}**   |   <:charisma:1509251389321122064> **${charismaCount}**\n\n`;

        // 🔥 TAMPILAN BIO DENGAN CODE BLOCK 🔥
        desc += `${divider}\n`;
        desc += `**BIO:**\n\`\`\`text\n${userData.bio || 'Not set.'}\n\`\`\``;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(desc);

        if (userData.album) embed.setImage(userData.album);

        const componentsArray = [];
        
        if (targetUser.id !== message.author.id) {
            const likeBtn = new ButtonBuilder()
                .setCustomId(`like_profile_${targetUser.id}`)
                .setLabel('Like / Unlike')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:like:1509251461719261214>');

            const charmBtn = new ButtonBuilder()
                .setCustomId(`charm_profile_${targetUser.id}`)
                .setLabel('Charm')
                .setStyle(ButtonStyle.Success);

            componentsArray.push(new ActionRowBuilder().addComponents(likeBtn, charmBtn));
        }

        return message.reply({ embeds: [embed], components: componentsArray });
    },

    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your or another player\'s RPG Profile.')
        .addUserOption(option => option.setName('user').setDescription('Select a user (Optional)').setRequired(false)),

    async executeSlash(interaction) {
        const client = interaction.client; // 🚀 Akses mesin utama

        const targetUser = interaction.options.getUser('user') || interaction.user;
        if (targetUser.bot) return interaction.reply({ content: '❌ Bots do not have an RPG profile.', ephemeral: true });

        const guildId = interaction.guild.id;
        
        // 🚀 TARIK DATA LANGSUNG DARI RAM
        const userData = client.getProfile(guildId, targetUser.id);
        
        const currentLevel = userData.level || 1;
        const currentXP = userData.xp || 0;
        const requiredXP = currentLevel * currentLevel * 100;
        const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
        
        const xpInCurrentLevel = currentXP - previousLevelXP;
        const xpNeededForLevelUp = requiredXP - previousLevelXP;
        const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForLevelUp, 15);

        const divider = '─────────────────────';
        let desc = `**${userData.activeTitle || 'New Explorer'}**\n${divider}\n`;
        
        if (userData.badges && userData.badges.length > 0) {
            desc += `${userData.badges.join(' ')}\n${divider}\n`;
        }

        desc += `**PROGRESS:**\nLevel: **${currentLevel}**\n${xpInCurrentLevel} / ${xpNeededForLevelUp} XP\n\`${progressBar}\`\n${divider}\n`;

        const userTag = userData.gamertag || '*Not set*';
        const clanTag = userData.clan || '*Not set*';
        const likesCount = userData.likes ? userData.likes.length : 0;
        const charismaCount = userData.charisma || 0;

        desc += `**USER INFO:**\n`;
        desc += `<:user:1509262449394716803> ${userTag}\n`;
        desc += `<:clan:1509262421423034549> ${clanTag}\n\n`;
        desc += `<:like:1509251461719261214> **${likesCount}**   |   <:charisma:1509251389321122064> **${charismaCount}**\n\n`;

        // 🔥 TAMPILAN BIO DENGAN CODE BLOCK 🔥
        desc += `${divider}\n`;
        desc += `**BIO:**\n\`\`\`text\n${userData.bio || 'Not set.'}\n\`\`\``;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(desc);

        if (userData.album) embed.setImage(userData.album);

        const componentsArray = [];

        if (targetUser.id !== interaction.user.id) {
            const likeBtn = new ButtonBuilder()
                .setCustomId(`like_profile_${targetUser.id}`)
                .setLabel('Like / Unlike')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:like:1509251461719261214>');

            const charmBtn = new ButtonBuilder()
                .setCustomId(`charm_profile_${targetUser.id}`)
                .setLabel('Charm')
                .setStyle(ButtonStyle.Success);

            componentsArray.push(new ActionRowBuilder().addComponents(likeBtn, charmBtn));
        }

        return interaction.reply({ embeds: [embed], components: componentsArray });
    }
};