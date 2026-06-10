const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'antiinvite',
    description: 'Toggle the Anti-Invite shield to block Discord server links (Admin Only).',

    // ==========================================
    // 1. PREFIX COMMAND (pon antiinvite on/off)
    // ==========================================
    async executePrefix(message, args, settingsFile, settings) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **Access Denied:** Administrator permission required.' });
        }

        const mode = args[0] ? args[0].toLowerCase() : null;
        if (mode !== 'on' && mode !== 'off') {
            return message.reply({ content: '**Usage:** `pon antiinvite [on / off]`' });
        }

        const guildId = message.guild.id;
        if (!settings[guildId]) settings[guildId] = {};

        const isEnabled = mode === 'on';
        settings[guildId].antiInvite = isEnabled;

        // Simpan ke database
        try {
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
            
            const embed = new EmbedBuilder()
                .setColor(isEnabled ? '#2F3136' : '#2F3136')
                .setTitle(isEnabled ? '🛡️ ANTI-INVITE SHIELD ACTIVATED' : '⚠️ ANTI-INVITE SHIELD DEACTIVATED')
                .setDescription(isEnabled 
                    ? 'The outpost is now secured. Any unauthorized Discord invite links will be destroyed on sight.' 
                    : 'The shield is down. Members can now send Discord invite links freely.')
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply({ content: '❌ **Database Error:** Failed to save settings.' });
        }
    },

    // ==========================================
    // 2. SLASH COMMAND (/antiinvite mode)
    // ==========================================
    data: new SlashCommandBuilder()
        .setName('antiinvite')
        .setDescription('Toggle the Anti-Invite shield to block Discord links (Admin Only).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option => 
            option.setName('mode')
                .setDescription('Turn the shield ON or OFF')
                .setRequired(true)
                .addChoices(
                    { name: '🛡️ ON (Block Invites)', value: 'on' },
                    { name: '⚠️ OFF (Allow Invites)', value: 'off' }
                )),

    async executeSlash(interaction, settingsFile, settings) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ **Access Denied:** Administrator permission required.', ephemeral: true });
        }

        const mode = interaction.options.getString('mode');
        const guildId = interaction.guild.id;
        if (!settings[guildId]) settings[guildId] = {};

        const isEnabled = mode === 'on';
        settings[guildId].antiInvite = isEnabled;

        try {
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
            
            const embed = new EmbedBuilder()
                .setColor(isEnabled ? '#77B255' : '#DD2E44')
                .setTitle(isEnabled ? '🛡️ ANTI-INVITE SHIELD ACTIVATED' : '⚠️ ANTI-INVITE SHIELD DEACTIVATED')
                .setDescription(isEnabled 
                    ? 'The outpost is now secured. Any unauthorized Discord invite links will be destroyed on sight.' 
                    : 'The shield is down. Members can now send Discord invite links freely.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ **Database Error:** Failed to save settings.', ephemeral: true });
        }
    }
};
