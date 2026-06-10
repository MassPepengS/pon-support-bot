require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// --- VARIABEL GLOBAL & LOKASI FILE ---
// ==========================================
client.PREFIX = 'pon';
client.SETTINGS_FILE = './serverSettings.json';
client.AFK_FILE = './afk.json';
client.PROFILE_FILE = './profiles.json';
client.commands = new Collection();

// ==========================================
// --- 🔥 SISTEM CACHE: SERVER SETTINGS 🔥 ---
// ==========================================
client.databaseCache = null;

client.checkDatabase = function(guildId) {
    if (!client.databaseCache) {
        try { 
            client.databaseCache = JSON.parse(fs.readFileSync(client.SETTINGS_FILE, 'utf8')); 
        } catch (e) { 
            client.databaseCache = {}; 
        }
    }

    let settings = client.databaseCache;
    let changed = false;

    if (!settings[guildId] || typeof settings[guildId] === 'string') {
        settings[guildId] = { channelId: null, gifs: [], authorizedUsers: [], logChannelId: null, suggestionChannelId: null, modLogChannelId: null, muteRoleId: null, badWords: [], caseCount: 0, warns: {}, linkAllowedChannels: [], tempbans: [] };
        changed = true;
    }
    if (!settings[guildId].badWords) { settings[guildId].badWords = []; changed = true; }
    if (!Array.isArray(settings[guildId].authorizedUsers)) { settings[guildId].authorizedUsers = []; changed = true; }
    if (!Array.isArray(settings[guildId].linkAllowedChannels)) { settings[guildId].linkAllowedChannels = []; changed = true; }
    if (!Array.isArray(settings[guildId].tempbans)) { settings[guildId].tempbans = []; changed = true; }

    if (changed) {
        fs.writeFile(client.SETTINGS_FILE, JSON.stringify(settings, null, 2), (err) => {
            if (err) console.error('⚠️ [ERROR] Failed to save settings to disk:', err);
        });
    }
    
    return settings;
};

// ==========================================
// --- 🔥 SISTEM CACHE: RPG PROFILES 🔥 ---
// ==========================================
client.profileCache = null;

client.getProfile = function(guildId, userId) {
    if (!client.profileCache) {
        try { 
            client.profileCache = JSON.parse(fs.readFileSync(client.PROFILE_FILE, 'utf8')); 
        } catch (e) { 
            client.profileCache = {}; 
        }
    }

    let db = client.profileCache;
    let changed = false;

    if (!db[guildId]) { 
        db[guildId] = {}; 
        changed = true; 
    }
    
    if (!db[guildId][userId]) {
        db[guildId][userId] = { 
            xp: 0, level: 1, titles: [], badges: [], activeTitle: "New Explorer", 
            gamertag: null, clan: null, album: null, likes: [], charisma: 0, inventory: {}, bio: null 
        };
        changed = true;
    }

    if (!db[guildId][userId].inventory) { db[guildId][userId].inventory = {}; changed = true; }
    if (!Array.isArray(db[guildId][userId].likes)) { db[guildId][userId].likes = []; changed = true; }
    if (typeof db[guildId][userId].charisma === 'undefined') { db[guildId][userId].charisma = 0; changed = true; }
    
    // 🔥 TAMBAHAN: Pengecekan otomatis agar member lama tidak error saat membuka bio
    if (typeof db[guildId][userId].bio === 'undefined') { db[guildId][userId].bio = null; changed = true; }

    if (changed) client.saveProfile();

    return db[guildId][userId];
};

client.saveProfile = function() {
    if (!client.profileCache) return;
    fs.writeFile(client.PROFILE_FILE, JSON.stringify(client.profileCache, null, 4), (err) => {
        if (err) console.error('⚠️ [ERROR] Failed to save profiles to disk:', err);
    });
};

// 🔥 TAMBAHAN: Auto-Save ke hardisk setiap 3 Menit agar data RAM tidak hilang jika server restart
setInterval(() => {
    if (client.profileCache) client.saveProfile();
}, 3 * 60 * 1000);


// ==========================================
// --- PENYIAPAN FILE AWAL (BOOTING) ---
// ==========================================
if (!fs.existsSync(client.SETTINGS_FILE)) fs.writeFileSync(client.SETTINGS_FILE, JSON.stringify({}));
if (!fs.existsSync(client.AFK_FILE)) fs.writeFileSync(client.AFK_FILE, JSON.stringify({}));
if (!fs.existsSync(client.PROFILE_FILE)) fs.writeFileSync(client.PROFILE_FILE, JSON.stringify({}));

// ==========================================
// --- LOADER COMMANDS & EVENTS ---
// ==========================================
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('name' in command) client.commands.set(command.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.login(process.env.TOKEN);