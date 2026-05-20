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

// Menyimpan variabel utama ke dalam client agar bisa diakses oleh event lain
client.PREFIX = 'pon';
client.SETTINGS_FILE = './serverSettings.json';
client.AFK_FILE = './afk.json';
client.commands = new Collection();

// Fungsi Cek Database terpusat
client.checkDatabase = function(guildId) {
    let settings = {};
    try { settings = JSON.parse(fs.readFileSync(client.SETTINGS_FILE, 'utf8')); } catch (e) { settings = {}; }
    let changed = false;

    if (!settings[guildId] || typeof settings[guildId] === 'string') {
        settings[guildId] = { channelId: null, gifs: [], authorizedUsers: [], logChannelId: null, suggestionChannelId: null, modLogChannelId: null, muteRoleId: null, badWords: [], caseCount: 0, warns: {}, linkAllowedChannels: [], tempbans: [] };
        changed = true;
    }
    if (!settings[guildId].badWords) { settings[guildId].badWords = []; changed = true; }
    if (!Array.isArray(settings[guildId].authorizedUsers)) { settings[guildId].authorizedUsers = []; changed = true; }
    if (!Array.isArray(settings[guildId].linkAllowedChannels)) { settings[guildId].linkAllowedChannels = []; changed = true; }
    if (!Array.isArray(settings[guildId].tempbans)) { settings[guildId].tempbans = []; changed = true; }

    if (changed) fs.writeFileSync(client.SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return settings;
};

// Pastikan file database ada
if (!fs.existsSync(client.SETTINGS_FILE)) fs.writeFileSync(client.SETTINGS_FILE, JSON.stringify({}));
if (!fs.existsSync(client.AFK_FILE)) fs.writeFileSync(client.AFK_FILE, JSON.stringify({}));

// LOADER COMMANDS
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('name' in command) client.commands.set(command.name, command);
    }
}

// LOADER EVENTS
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
