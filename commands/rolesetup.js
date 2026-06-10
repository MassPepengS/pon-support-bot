const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rolesetup',
    
    // ==========================================
    // EKSEKUSI VIA PREFIX (pon rolesetup #channel)
    // ==========================================
    async executePrefix(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('❌ No permission!');

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply(`❌ Format wrong!\nUse: \`${message.client.PREFIX || 'pon'} rolesetup [#channel]\``);
        }

        const serverRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('server_roles_menu')
            .setPlaceholder('Select Server Roles...')
            .setMinValues(0)
            .setMaxValues(4)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Announcements').setValue('role_announcements').setEmoji('📢'),
                new StringSelectMenuOptionBuilder().setLabel('Sneak Peaks').setValue('role_sneakpeaks').setEmoji('👀'),
                new StringSelectMenuOptionBuilder().setLabel('Updates').setValue('role_updates').setEmoji('📌'),
                new StringSelectMenuOptionBuilder().setLabel('Guides').setValue('role_guides').setEmoji('📖')
            );

        const langRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('language_roles_menu')
            .setPlaceholder('Select Language Roles...')
            .setMinValues(0)
            .setMaxValues(10)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Indonesian').setValue('role_id').setEmoji('🇮🇩'),
                new StringSelectMenuOptionBuilder().setLabel('Russian').setValue('role_ru').setEmoji('🇷🇺'),
                new StringSelectMenuOptionBuilder().setLabel('Portuguese').setValue('role_pt').setEmoji('🇵🇹'),
                new StringSelectMenuOptionBuilder().setLabel('Philippines').setValue('role_ph').setEmoji('🇵🇭'),
                new StringSelectMenuOptionBuilder().setLabel('Malaysian').setValue('role_my').setEmoji('🇲🇾'),
                new StringSelectMenuOptionBuilder().setLabel('Español').setValue('role_es').setEmoji('🇪🇸'),
                new StringSelectMenuOptionBuilder().setLabel('France').setValue('role_fr').setEmoji('🇫🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Indian').setValue('role_in').setEmoji('🇮🇳'),
                new StringSelectMenuOptionBuilder().setLabel('Brazil').setValue('role_br').setEmoji('🇧🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Thailand').setValue('role_th').setEmoji('🇹🇭')
            );

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('✨ PIONEER OUTPOST ROLES')
            .setDescription('**Customize your experience!**\nSelect the roles you want from the dropdown menus below.\n\n📢 **Server Roles:** Get pinged for announcements, updates, and sneaks.\n🌍 **Language Roles:** Unlock your local language lobby channels.')
            .setImage('https://i.imgur.com/jm5RQ9W.png'); // <--- TAUTAN GIF TERBARU SUDAH DIPASANG

        const row1 = new ActionRowBuilder().addComponents(serverRolesMenu);
        const row2 = new ActionRowBuilder().addComponents(langRolesMenu);

        await channel.send({ embeds: [embed], components: [row1, row2] });
        await message.reply(`✅ Role Panel successfully deployed to <#${channel.id}>!`);
    },

    // ==========================================
    // EKSEKUSI VIA SLASH COMMAND (/rolesetup)
    // ==========================================
    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content: '❌ No permission!', ephemeral: true});

        const serverRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('server_roles_menu')
            .setPlaceholder('Select Server Roles...')
            .setMinValues(0)
            .setMaxValues(4)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Announcements').setValue('role_announcements').setEmoji('📢'),
                new StringSelectMenuOptionBuilder().setLabel('Sneak Peaks').setValue('role_sneakpeaks').setEmoji('👀'),
                new StringSelectMenuOptionBuilder().setLabel('Updates').setValue('role_updates').setEmoji('📌'),
                new StringSelectMenuOptionBuilder().setLabel('Guides').setValue('role_guides').setEmoji('📖')
            );

        const langRolesMenu = new StringSelectMenuBuilder()
            .setCustomId('language_roles_menu')
            .setPlaceholder('Select Language Roles...')
            .setMinValues(0)
            .setMaxValues(10) 
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Indonesian').setValue('role_id').setEmoji('🇮🇩'),
                new StringSelectMenuOptionBuilder().setLabel('Russian').setValue('role_ru').setEmoji('🇷🇺'),
                new StringSelectMenuOptionBuilder().setLabel('Portuguese').setValue('role_pt').setEmoji('🇵🇹'),
                new StringSelectMenuOptionBuilder().setLabel('Philippines').setValue('role_ph').setEmoji('🇵🇭'),
                new StringSelectMenuOptionBuilder().setLabel('Malaysian').setValue('role_my').setEmoji('🇲🇾'),
                new StringSelectMenuOptionBuilder().setLabel('Español').setValue('role_es').setEmoji('🇪🇸'),
                new StringSelectMenuOptionBuilder().setLabel('France').setValue('role_fr').setEmoji('🇫🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Indian').setValue('role_in').setEmoji('🇮🇳'),
                new StringSelectMenuOptionBuilder().setLabel('Brazil').setValue('role_br').setEmoji('🇧🇷'),
                new StringSelectMenuOptionBuilder().setLabel('Thailand').setValue('role_th').setEmoji('🇹🇭')
            );

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('✨ PIONEER OUTPOST ROLES')
            .setDescription('**Customize your experience!**\nSelect the roles you want from the dropdown menus below.\n\n📢 **Server Roles:** Get pinged for announcements, updates, and sneaks.\n🌍 **Language Roles:** Unlock your local language lobby channels.')
            .setImage('https://i.imgur.com/y2lCoSb.gif'); // <--- TAUTAN GIF TERBARU SUDAH DIPASANG

        const row1 = new ActionRowBuilder().addComponents(serverRolesMenu);
        const row2 = new ActionRowBuilder().addComponents(langRolesMenu);

        await interaction.channel.send({ embeds: [embed], components: [row1, row2] });
        await interaction.reply({ content: '✅ Role Panel deployed successfully!', ephemeral: true });
    }
};