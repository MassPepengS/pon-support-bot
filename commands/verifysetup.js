const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'verifysetup',
    async executePrefix(message, args, SETTINGS_FILE) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('❌ No permission!');

        const roles = Array.from(message.mentions.roles.values());
        const channel = message.mentions.channels.first();

        if (roles.length < 2 || !channel) {
            return message.reply(`❌ Format Wrong!\nUse: \`${message.client.PREFIX} verifysetup [@role_unverified] [@role_verified] [#channel]\``);
        }

        const unvRole = roles[0];
        const verRole = roles[1];
        const guildId = message.guild.id;

        // 🚀 BACA DARI MESIN RAM
        const guildSettings = message.client.checkDatabase(guildId);
        guildSettings.unverifiedRoleId = unvRole.id;
        guildSettings.verifiedRoleId = verRole.id;
        
        // Simpan asinkron di latar belakang (Anti-Lag)
        fs.writeFile(SETTINGS_FILE, JSON.stringify(message.client.databaseCache, null, 2), (err) => {
            if (err) console.error("Gagal save verifysetup:", err);
        });

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🛡️ OUTPOST SECURITY GATE')
            .setDescription('**HALT, EXPLORER!**\n\nTo protect Pioneer Outpost from bot raids and spammers, all new members must pass a quick security check.\n\nClick the **"VERIFY NOW"** button below. A private channel will be deployed for you to complete a simple CAPTCHA code.\n\n*Once verified, you will gain full access to the server!*')
            .setImage('https://i.imgur.com/QW3AZ9Q.png');

        const btn = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('VERIFY NOW')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛡️');

        const row = new ActionRowBuilder().addComponents(btn);

        await channel.send({ embeds: [embed], components: [row] });
        await message.reply(`✅ Verification panel successfully deployed to <#${channel.id}>!`);
    },
    async executeSlash(interaction, SETTINGS_FILE) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content: '❌ No permission!', ephemeral: true});

        // 🚀 KUNCI PERBAIKAN: Minta waktu tambahan ke Discord (Mengatasi error 3 detik)
        await interaction.deferReply({ ephemeral: true });

        const unvRole = interaction.options.getRole('unverified');
        const verRole = interaction.options.getRole('verified');
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        
        // 🚀 BACA DARI MESIN RAM
        const guildSettings = interaction.client.checkDatabase(guildId);
        guildSettings.unverifiedRoleId = unvRole.id;
        guildSettings.verifiedRoleId = verRole.id;
        
        // Simpan asinkron di latar belakang (Anti-Lag)
        fs.writeFile(SETTINGS_FILE, JSON.stringify(interaction.client.databaseCache, null, 2), (err) => {
            if (err) console.error("Gagal save verifysetup:", err);
        });

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🛡️ OUTPOST SECURITY GATE')
            .setDescription('**HALT, EXPLORER!**\n\nTo protect Pioneer Outpost from bot raids and spammers, all new members must pass a quick security check.\n\nClick the **"VERIFY NOW"** button below. A private channel will be deployed for you to complete a simple CAPTCHA code.\n\n*Once verified, you will gain full access to the server!*')
            .setImage('https://i.imgur.com/QW3AZ9Q.png');

        const btn = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('VERIFY NOW')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛡️');

        const row = new ActionRowBuilder().addComponents(btn);

        await channel.send({ embeds: [embed], components: [row] });
        
        // 🚀 Ubah dari .reply menjadi .editReply karena kita sudah memanggil deferReply di atas
        await interaction.editReply({ content: `✅ Verification panel successfully deployed to ${channel}!` });
    }
};