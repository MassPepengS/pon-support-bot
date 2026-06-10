const { Events, EmbedBuilder } = require('discord.js');
const welcomeHandler = require('../commands/welcome.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // Abaikan jika yang masuk adalah bot
        if (member.user.bot) return;

        const guildId = member.guild.id;
        
        // 🚀 BACA DARI MESIN RAM (Ditambah || {} agar anti-crash jika laci kosong)
        const settings = client.checkDatabase(guildId) || {};
        
        const unverifiedRoleId = settings.unverifiedRoleId;
        const modLogChannelId = settings.modLogChannelId;
        
        // 1. AUTO-ROLE UNVERIFIED (Langsung pasang borgol saat baru masuk)
        if (unverifiedRoleId) {
            const unvRole = member.guild.roles.cache.get(unverifiedRoleId);
            if (unvRole) {
                // Berikan role secara diam-diam
                await member.roles.add(unvRole).catch(()=>{});

                // --- 🔥 TAMBAHAN: AUTO-ROLE LOGGING KE MODERATION LOG 🔥 ---
                let logChannel = null;
                if (modLogChannelId) {
                    logChannel = member.guild.channels.cache.get(modLogChannelId) || await member.guild.channels.fetch(modLogChannelId).catch(() => null);
                } else {
                    // Fitur Anti-Nyasar
                    logChannel = member.guild.channels.cache.find(c => c.name === 'moderation-logs' || c.name === 'mod-logs');
                }

                if (logChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setAuthor({ 
                            name: `System Action | ${member.user.username}`, 
                            iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                        })
                        .setDescription(
                            `**USER**\n<@${member.user.id}> | ${member.user.username}\n` +
                            `**STAFF**\n<@${client.user.id}> (Auto-System)\n` +
                            `**ACTION**\nAuto-Role (Unverified)\n` +
                            `**REASON**\nNew Member Entry\n\n` +
                            `**ROLE GIVEN:** <@&${unverifiedRoleId}>`
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [embedLog] }).catch(() => {});
                }
                // -------------------------------------------------------------
            }
        }

        // 2. WELCOME SYSTEM
        if (welcomeHandler.handleWelcome) {
            await welcomeHandler.handleWelcome(member, client.SETTINGS_FILE);
        }
    },
}