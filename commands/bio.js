const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    // 🔥 INI SANGAT PENTING AGAR COMMAND TERBACA OLEH BOT
    name: 'bio', 
    description: 'Set or update your profile bio.',
    aliases: ['bio', 'setbio'],
    data: new SlashCommandBuilder()
        .setName('bio')
        .setDescription('Set or update your profile bio.'),
    
    async executePrefix(message, args) {
        // Menggunakan message.client agar aman dan langsung terhubung ke RAM
        return this.executeBio(message, message.client, message.author.id, message.guild.id);
    },
    
    async executeSlash(interaction) {
        // Menggunakan interaction.client agar aman
        return this.executeBio(interaction, interaction.client, interaction.user.id, interaction.guild.id);
    },
    
    async executeBio(context, client, userId, guildId) {
        // 🚀 Tarik data profil dari mesin In-Memory Cache
        const userData = client.getProfile(guildId, userId);
        const targetUserObj = context.author || context.user;

        // --- Perhitungan Progress ---
        const currentLevel = userData.level || 1;
        const currentXP = userData.xp || 0;
        const previousLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
        const requiredXP = currentLevel * currentLevel * 100;
        const xpInCurrentLevel = currentXP - previousLevelXP;
        const xpNeededForLevelUp = requiredXP - previousLevelXP;
        
        const size = 15;
        const progress = Math.round((xpInCurrentLevel / xpNeededForLevelUp) * size);
        const safeProgress = Math.min(Math.max(progress, 0), size);
        const progressBar = `[${'■'.repeat(safeProgress)}${'□'.repeat(size - safeProgress)}]`;
        
        // --- Perakitan Deskripsi Embed ---
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
        desc += `<:like:1509251461719261214> **${likesCount}** |   <:charisma:1509251389321122064> **${charismaCount}**\n\n`;
        
        // 🔥 PENAMBAHAN BIO DENGAN CODE BLOCK 🔥
        desc += `${divider}\n`;
        desc += `**BIO:**\n\`\`\`text\n${userData.bio || 'Not set. Select from the menu below to write your bio!'}\n\`\`\``;

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ name: `${targetUserObj.username}'s Profile`, iconURL: targetUserObj.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUserObj.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(desc);

        if (userData.album) embed.setImage(userData.album);

        // --- Menu Dropdown ---
        const menu = new StringSelectMenuBuilder()
            .setCustomId('select_bio_menu')
            .setPlaceholder('Manage your profile bio...')
            .addOptions([
                {
                    label: 'Write Bio',
                    description: 'Set or update your profile description.',
                    value: 'edit_bio',
                    emoji: '1512265753997480058' // Emoji custom bio milikmu
                }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        if (context.reply) {
            await context.reply({ embeds: [embed], components: [row] });
        } else {
            await context.channel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });
        }
    }
};