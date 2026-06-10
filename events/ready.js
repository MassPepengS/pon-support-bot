const { Events, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Success! Bot ${client.user.tag} is online & ready!`);
        client.user.setActivity({ type: ActivityType.Custom, name: 'custom', state: 'Support, 24/7' });

        // ==========================================
        // ALARM UNBAN OTOMATIS (Mengecek setiap 1 Menit)
        // ==========================================
        setInterval(async () => {
            try {
                // 🚀 BACA DARI MESIN RAM (Super Ringan & Anti-Lag!)
                if (!client.databaseCache) return; // Abaikan jika RAM belum siap dimuat oleh index.js
                const db = client.databaseCache;
                let dbChanged = false;
                
                for (const guildId in db) {
                    if (db[guildId].tempbans && db[guildId].tempbans.length > 0) {
                        const now = Date.now();
                        const guild = client.guilds.cache.get(guildId);
                        if (!guild) continue;

                        const activeBans = [];
                        for (const tb of db[guildId].tempbans) {
                            if (now >= tb.unbanAt) {
                                await guild.bans.remove(tb.userId, "Auto-Unban: Tempban duration expired").catch(()=>{});
                                dbChanged = true;
                                
                                const logChanId = db[guildId].modLogChannelId;
                                if (logChanId) {
                                    const logChan = guild.channels.cache.get(logChanId);
                                    if (logChan) {
                                        db[guildId].caseCount = (db[guildId].caseCount || 0) + 1;
                                        const caseId = db[guildId].caseCount.toString().padStart(6, '0');
                                        const embed = new EmbedBuilder()
                                            .setColor('#2ECC71')
                                            .setAuthor({name: `AutoMod Action | Unban`})
                                            .setDescription(`**USER ID**\n${tb.userId}\n**STAFF**\nAutoMod\n**ACTION**\nAuto-Unban (Tempban Expired)\n\n**CASE ID:** ${caseId}`)
                                            .setTimestamp();
                                        await logChan.send({embeds: [embed]}).catch(()=>{});
                                    }
                                }
                            } else {
                                activeBans.push(tb);
                            }
                        }
                        if (db[guildId].tempbans.length !== activeBans.length) {
                            db[guildId].tempbans = activeBans;
                            dbChanged = true;
                        }
                    }
                }
                
                // Simpan asinkron di latar belakang HANYA jika ada yang di-unban
                if (dbChanged) {
                    fs.writeFile(client.SETTINGS_FILE, JSON.stringify(db, null, 2), (err) => {
                        if (err) console.error("Gagal save Auto-Unban:", err);
                    });
                }
            } catch (error) { console.error("Auto-Unban Error:", error); }
        }, 60000);
    },
};