const fs = require('fs');
const { SETTINGS_FILE, AFK_FILE } = require('../config');

/**
 * Pastikan file database (settings & afk) ada.
 */
function initDatabase() {
    if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}));
    if (!fs.existsSync(AFK_FILE)) fs.writeFileSync(AFK_FILE, JSON.stringify({}));
}

/**
 * Pastikan struktur server settings selalu valid; lakukan migrasi otomatis bila
 * struktur lama (string) terdeteksi atau ada field baru yang belum ada.
 */
function checkDatabase(guildId) {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    let changed = false;

    if (!settings[guildId] || typeof settings[guildId] === 'string') {
        settings[guildId] = {
            channelId: typeof settings[guildId] === 'string' ? settings[guildId] : null,
            gifs: [],
            authorizedUsers: [],
            logChannelId: null,
            suggestionChannelId: null
        };
        changed = true;
    }

    if (!Array.isArray(settings[guildId].authorizedUsers)) {
        settings[guildId].authorizedUsers = [];
        changed = true;
    }

    if (settings[guildId].logChannelId === undefined) {
        settings[guildId].logChannelId = null;
        changed = true;
    }

    if (settings[guildId].suggestionChannelId === undefined) {
        settings[guildId].suggestionChannelId = null;
        changed = true;
    }

    if (changed) saveSettings(settings);
    return settings;
}

/**
 * Simpan settings ke disk secara aman (atomic write).
 */
function saveSettings(settings) {
    const tmpFile = SETTINGS_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2));
    fs.renameSync(tmpFile, SETTINGS_FILE);
}

module.exports = { initDatabase, checkDatabase, saveSettings };
