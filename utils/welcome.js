const fs = require('fs');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { SETTINGS_FILE } = require('../config');

const DEFAULT_GIFS = [
    'https://i.imgur.com/BglAjSy.gif',
    'https://i.imgur.com/vrQg7vL.gif',
    'https://i.imgur.com/Sk1vR7g.gif',
    'https://i.imgur.com/roYS4i5.gif',
    'https://i.imgur.com/5VR57Rc.gif'
];

const WELCOME_TEXTS = [
    `The ground trembles 🌋, and a deafening roar welcomes your arrival, {MENTION}! You have set foot in a brutal, unforgiving primal world. Here, the absolute law of nature dictates: hunt or be hunted. Sharpen your weapons ⚔️, hone your survival instincts, and prove that you are more than just fresh meat for the vicious predators 🦖 lurking in the dense fern forests.`,
    `The scent of blood 🩸 and volcanic ash fills the air as you awaken in this savage land, {MENTION}. Welcome to prehistoric hell! There is no place for the weak here; your every step is watched by hungry, ancient eyes 👁️ from the shadows of the undergrowth. Will you become a feared apex predator, or just another pile of bones ☠️ crushed beneath the weight of prehistoric giants? Rise, and fight for your life!`,
    `The sound of giant reptilian wings 🐉 beating above your head is your only greeting in this barbaric realm, {MENTION}. This is no place for rest or hesitation. You have been thrown right into the middle of an eternal war between colossal, cold-blooded monsters. Gather your strength, build your defenses 🛡️, and never sleep too deeply. Show your fangs 🦷 to this cruel world before it tears you apart!`,
    `Giant footprints 🐾, the size of your entire body, are stamped deeply into the wet mud beneath you, {MENTION}. You have entered the territory of the ancient lords! This world is harsh, barbaric, and ready to crush anyone who hesitates. Do not expect mercy, for fangs and claws 🦖 are the only languages understood here. Grip your weapon tight 🔪 and let the primal hunt begin!`,
    `Welcome to the land of famine and ferocity, {MENTION}! Civilization means nothing here, replaced by the law of the jungle 🌴 where apex predators reign supreme. Feel the earth shake 💥 every time the behemoths take a step in search of fresh prey. You are destined to survive amidst this prehistoric chaos. Become fiercer than your environment, or prepare to be devoured 🍖 by the wild!`
];

/**
 * Kirim welcome message saat member baru join.
 */
async function sendWelcome(member) {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return;
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        const guildData = settings[member.guild.id];
        if (!guildData) return;

        let welcomeChannelId = null;
        let gifs = DEFAULT_GIFS;

        if (typeof guildData === 'string') {
            welcomeChannelId = guildData;
        } else {
            welcomeChannelId = guildData.channelId;
            if (Array.isArray(guildData.gifs) && guildData.gifs.length > 0) gifs = guildData.gifs;
        }

        if (!welcomeChannelId) return;
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (!channel) return;

        const mention = `<@${member.id}>`;
        const randomText = WELCOME_TEXTS[Math.floor(Math.random() * WELCOME_TEXTS.length)].replace('{MENTION}', mention);
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        const attachment = new AttachmentBuilder(randomGif, { name: 'dino.gif' });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('FRESH MEAT HAS ARRIVED! 🦖')
            .setDescription(randomText)
            .setImage('attachment://dino.gif')
            .setFooter({ text: 'The law of the jungle is absolute.' });

        await channel.send({
            content: `Greetings ${mention}, brace yourself...`,
            embeds: [welcomeEmbed],
            files: [attachment]
        });
    } catch (err) {
        console.error('sendWelcome error:', err);
    }
}

module.exports = { sendWelcome, DEFAULT_GIFS };
