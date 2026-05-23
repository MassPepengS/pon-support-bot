const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'verifysetup',
    async executePrefix(message) {
        return message.reply("❌ Please use the slash command `/verifysetup` for easy role selection.");
    },
    async executeSlash(interaction, SETTINGS_FILE, settings) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content: '❌ No permission!', ephemeral: true});

        const unvRole = interaction.options.getRole('unverified');
        const verRole = interaction.options.getRole('verified');
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        
        // Simpan konfigurasi role ke database
        let db = {};
        try { db = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch(e){}
        if (!db[guildId]) db[guildId] = {};
        
        db[guildId].unverifiedRoleId = unvRole.id;
        db[guildId].verifiedRoleId = verRole.id;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(db, null, 2));

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🛡️ OUTPOST SECURITY GATE')
            .setDescription('**HALT, EXPLORER!**\n\nTo protect Pioneer Outpost from bot raids and spammers, all new members must pass a quick security check.\n\nClick the **"VERIFY NOW"** button below. A private channel will be deployed for you to complete a simple CAPTCHA code.\n\n-# Once verified, you will gain full access to the server!')
            .setImage('https://i.imgur.com/CUsxRFY.gif');

        const btn = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('VERIFY NOW')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛡️');

        const row = new ActionRowBuilder().addComponents(btn);

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Verification panel successfully deployed to ${channel}! Roles have been mapped.`, ephemeral: true });
    }
};
