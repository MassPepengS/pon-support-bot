const { EmbedBuilder, version } = require('discord.js');

module.exports = {
    name: 'info',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        const embed = await this.buildInfoEmbed(message.client, message.createdTimestamp);
        return message.reply({ embeds: [embed] });
    },
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        await interaction.deferReply();
        const embed = await this.buildInfoEmbed(interaction.client, interaction.createdTimestamp);
        return interaction.editReply({ embeds: [embed] });
    },

    async buildInfoEmbed(client, startTimestamp) {
        // Menghitung Uptime (Waktu Aktif Bot)
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        let uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Menghitung Ping / Latency
        const wsPing = client.ws.ping; 
        const roundTripPing = Date.now() - startTimestamp; 

        // Menghitung Jumlah Server & User
        const serverCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

        // Menghitung Penggunaan RAM
        const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        // GANTI LINK DI BAWAH INI  DENGAN LINK INVITE SERVER DISCORD KAMU
        const serverInviteLink = 'https://discord.gg/JsA69NSskh';

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('📊 PIONEER OUTPOST NUSA | BOT SYSTEM')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription('Here is the current status and telemetry of the Outpost Support system.')
            .addFields(
                { name: '👑 Developer', value: '`PON Server Team`', inline: true },
                { name: '🌐 Support Server', value: `[Click Here to Join](${serverInviteLink})`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Kolom kosong agar rapi
                { name: '📡 Latency (Ping)', value: `\`🤖 API : ${wsPing}ms\`\n\`⏱️ Bot : ${roundTripPing}ms\``, inline: true },
                { name: '📈 Statistics', value: `\`🗄️ Servers : ${serverCount}\`\n\`👥 Users   : ${userCount}\``, inline: true },
                { name: '⚙️ System', value: `\`⏳ Uptime : ${uptime}\`\n\`💾 RAM    : ${memoryUsed} MB\`\n\`📚 D.js   : v${version}\``, inline: true }
            )
            .setFooter({ text: 'PON Telemetry System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        return embed;
    }
};
