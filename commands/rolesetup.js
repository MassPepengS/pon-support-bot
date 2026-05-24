const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rolesetup',
    async executePrefix(message) {
        return message.reply("❌ Please use `/rolesetup`.");
    },
    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content: '❌ No permission!', ephemeral: true});

        // ==========================================
        // MENU 1: SERVER ROLES 
        // ==========================================
        const serverRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('server_roles_menu')
            .setPlaceholder('Select Server Roles...')
            .setMinValues(0)
            .setMaxValues(4)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Announcements').setValue('1508105498141130752').setEmoji('📢'),
                new StringSelectMenuOptionBuilder().setLabel('Sneak Peaks').setValue('1508105759475630261').setEmoji('👀'),
                new StringSelectMenuOptionBuilder().setLabel('Updates').setValue('1508105587597246515').setEmoji('📌'),
                new StringSelectMenuOptionBuilder().setLabel('Guides').setValue('1508105648548741120').setEmoji('📖')
            );

        // ==========================================
        // MENU 2: LANGUAGE ROLES 
        // ==========================================
        const langRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('language_roles_menu')
            .setPlaceholder('Select Language Roles...')
            .setMinValues(0)
            .setMaxValues(10) // Memberikan kebebasan pemain memilih hingga 10 role bahasa
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Indonesian').setValue('1508105893194109069').setEmoji('🇮🇩'),
                new StringSelectMenuOptionBuilder().setLabel('Russian').setValue('1508106052724592730').setEmoji('🇷🇺'),
                new StringSelectMenuOptionBuilder().setLabel('Portuguese').setValue('1508106146630603023').setEmoji('🇵🇹'),
                new StringSelectMenuOptionBuilder().setLabel('Philippines').setValue('1508106681551290520').setEmoji('🇵🇭'),
                new StringSelectMenuOptionBuilder().setLabel('Malaysian').setValue('1508106799964749906').setEmoji('🇲🇾'),
                new StringSelectMenuOptionBuilder().setLabel('Español').setValue('1508107072858886346').setEmoji('🇪🇸'),
                new StringSelectMenuOptionBuilder().setLabel('France').setValue('1508107321740365865').setEmoji('🇫🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Indian').setValue('1508107410412273894').setEmoji('🇮🇳'),
                new StringSelectMenuOptionBuilder().setLabel('Brazil').setValue('1508107522307919972').setEmoji('🇧🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Thailand').setValue('1508107603081957457').setEmoji('🇹🇭')
            );

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('✨ PIONEER OUTPOST ROLES')
            .setDescription('**Customize your experience!**\nSelect the roles you want from the dropdown menus below.\n\n📢 **Server Roles:** Get pinged for announcements, updates, and sneaks.\n🌍 **Language Roles:** Unlock your local language lobby channels.')
            .setImage('https://i.imgur.com/feJtRAt.gif');

        const row1 = new ActionRowBuilder().addComponents(serverRolesMenu);
        const row2 = new ActionRowBuilder().addComponents(langRolesMenu);

        await interaction.channel.send({ embeds: [embed], components: [row1, row2] });
        await interaction.reply({ content: '✅ Role Panel deployed successfully!', ephemeral: true });
    }
};
