const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'fixverify',
    description: 'Sync verification roles for older members (Legacy Members).',

    // ==========================================
    // 1. PREFIX COMMAND (pon fixverify ...)
    // ==========================================
    async executePrefix(message, args) {
        const p = 'pon'; // Prefix

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **Access Denied:** Administrator permission required.' });
        }

        const mentionedRoles = Array.from(message.mentions.roles.values());
        if (mentionedRoles.length < 2) {
            return message.reply({ content: `**Usage:** \`${p} fixverify [@unverified_role] [@verified_role]\`\n*Example:* \`${p} fixverify @Unverified @Verified\`` });
        }

        const unvRole = mentionedRoles[0];
        const verRole = mentionedRoles[1];

        const loadingMsg = await message.reply('⏳ **Scanning outpost population...** This might take a minute depending on server size.');

        try {
            const members = await message.guild.members.fetch();
            let count = 0;

            for (const [id, member] of members) {
                // Jangan proses bot, dan pastikan member tidak punya kedua role tersebut
                if (!member.user.bot && !member.roles.cache.has(verRole.id) && !member.roles.cache.has(unvRole.id)) {
                    await member.roles.add(unvRole).catch(() => {});
                    count++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🛡️ VERIFICATION SYNC COMPLETE')
                .setDescription(`Successfully synchronized legacy members.\n\nAssigned the ${unvRole} role to **${count}** members who missed the initial setup.`)
                .setTimestamp();

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error(error);
            await loadingMsg.edit('❌ **Error:** Failed to synchronize roles. Please check my permissions (Ensure my bot role is higher than the roles being assigned).');
        }
    },

    // ==========================================
    // 2. SLASH COMMAND (/fixverify)
    // ==========================================
    data: new SlashCommandBuilder()
        .setName('fixverify')
        .setDescription('Sync verification roles for older members (Admin Only).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addRoleOption(option =>
            option.setName('unverified_role')
                .setDescription('The role for unverified members')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('verified_role')
                .setDescription('The role for verified members')
                .setRequired(true)),

    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ **Access Denied:** Administrator permission required.', ephemeral: true });
        }

        const unvRole = interaction.options.getRole('unverified_role');
        const verRole = interaction.options.getRole('verified_role');

        // Defer reply sangat penting di sini karena proses scanning 900+ member bisa memakan waktu lebih dari 3 detik
        await interaction.deferReply({ ephemeral: true });

        try {
            const members = await interaction.guild.members.fetch();
            let count = 0;

            for (const [id, member] of members) {
                if (!member.user.bot && !member.roles.cache.has(verRole.id) && !member.roles.cache.has(unvRole.id)) {
                    await member.roles.add(unvRole).catch(() => {});
                    count++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🛡️ VERIFICATION SYNC COMPLETE')
                .setDescription(`Successfully synchronized legacy members.\n\nAssigned the ${unvRole} role to **${count}** members who missed the initial setup.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ **Error:** Failed to synchronize roles. Ensure my bot role is placed HIGHER than the unverified role.' });
        }
    }
};
