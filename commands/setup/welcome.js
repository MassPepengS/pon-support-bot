const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const { saveSettings } = require('../../utils/database');

const DEFAULT_GIFS = [
    'https://i.imgur.com/BglAjSy.gif', 'https://i.imgur.com/vrQg7vL.gif', 
    'https://i.imgur.com/Sk1vR7g.gif', 'https://i.imgur.com/roYS4i5.gif', 'https://i.imgur.com/5VR57Rc.gif'
];

module.exports = {
    name: 'wcm',
    
    // ==================== LOGIKA PASIF: MEMBER BARU BERGABUNG ====================
    async handleWelcome(member, SETTINGS_FILE) {
        try {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            const guildData = settings[member.guild.id];
            let welcomeChannelId = null;
            let gifs = [...DEFAULT_GIFS];

            if (guildData) {
                if (typeof guildData === 'string') welcomeChannelId = guildData;
                else {
                    welcomeChannelId = guildData.channelId;
                    if (guildData.gifs && guildData.gifs.length > 0) gifs = guildData.gifs;
                }
            }

            if (!welcomeChannelId) return;
            const channel = member.guild.channels.cache.get(welcomeChannelId);
            if (!channel) return;

            const welcomeTexts = [
                `The ground trembles 🌋, and a deafening roar welcomes your arrival, <@${member.id}>! You have set foot in a brutal, unforgiving primal world. Here, the absolute law of nature dictates: hunt or be hunted. Sharpen your weapons ⚔️, hone your survival instincts, and prove that you are more than just fresh meat for the vicious predators 🦖 lurking in the dense fern forests.`,
                `The scent of blood 🩸 and volcanic ash fills the air as you awaken in this savage land, <@${member.id}>. Welcome to prehistoric hell! There is no place for the weak here; your every step is watched by hungry, ancient eyes 👁️ from the shadows of the undergrowth. Will you become a feared apex predator, or just another pile of bones ☠️ crushed beneath the weight of prehistoric giants? Rise, and fight for your life!`,
                `The sound of giant reptilian wings 🐉 beating above your head is your only greeting in this barbaric realm, <@${member.id}>. This is no place for rest or hesitation. You have been thrown right into the middle of an eternal war between colossal, cold-blooded monsters. Gather your strength, build your defenses 🛡️, and never sleep too deeply. Show your fangs 🦷 to this cruel world before it tears you apart!`,
                `Giant footprints 🐾, the size of your entire body, are stamped deeply into the wet mud beneath you, <@${member.id}>. You have entered the territory of the ancient lords! This world is harsh, barbaric, and ready to crush anyone who hesitates. Do not expect mercy, for fangs and claws 🦖 are the only languages understood here. Grip your weapon tight 🔪 and let the primal hunt begin!`,
                `Welcome to the land of famine and ferocity, <@${member.id}>! Civilization means nothing here, replaced by the law of the jungle 🌴 where apex predators reign supreme. Feel the earth shake 💥 every time the behemoths take a step in search of fresh prey. You are destined to survive amidst this prehistoric chaos. Become fiercer than your environment, or prepare to be devoured 🍖 by the wild!`
            ];

            const randomText = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
            const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
            const attachment = new AttachmentBuilder(randomGif, { name: 'dino.gif' });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('FRESH MEAT HAS ARRIVED! 🦖')
                .setDescription(randomText)
                .setImage('attachment://dino.gif')
                .setFooter({ text: 'The law of the jungle is absolute.' });

            await channel.send({ content: `Greetings <@${member.id}>, brace yourself...`, embeds: [welcomeEmbed], files: [attachment] });
        } catch (err) { console.error(err); }
    },

    // ==================== LOGIKA PERINTAH WCM (PREFIX & SLASH) ====================
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        return this.manageWcm(message, args, 'PREFIX', SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        return this.manageWcm(interaction, null, 'SLASH', SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin);
    },

    async manageWcm(ctx, args, type, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        const isSlash = type === 'SLASH';
        const guildId = ctx.guild.id;

        if (!isRealAdmin && !isCustomAdmin) {
            return isSlash ? ctx.reply({ content: '❌ No permission!', ephemeral: true }) : ctx.reply('❌ No permission!');
        }

        const sub = isSlash ? ctx.options.getSubcommand() : (args[0] ? args[0].toLowerCase() : null);
        let currentGifs = [...DEFAULT_GIFS];
        if (settings[guildId].gifs && settings[guildId].gifs.length > 0) currentGifs = settings[guildId].gifs;

        // A. TAMBAH GIF
        if (sub === 'gif') {
            const link = isSlash ? ctx.options.getString('link') : args[1];
            if (!link || !link.toLowerCase().includes('imgur.com')) return ctx.reply('❌ Please provide a valid Imgur link!');

            let directLink = link;
            if (!directLink.toLowerCase().includes('i.imgur.com')) {
                directLink = directLink.replace(/https?:\/\/(www\.)?imgur\.com/, 'https://i.imgur.com');
                if (!directLink.toLowerCase().endsWith('.gif')) directLink += '.gif';
            }

            if (currentGifs.length >= 5) return ctx.reply('❌ Limit of 5 GIFs reached!');
            currentGifs.push(directLink);
            settings[guildId].gifs = currentGifs;
            saveSettings(settings);
            return ctx.reply(`✅ Added GIF (${currentGifs.length}/5)!`);
        }

        // B. LIST GIF
        if (sub === 'list') {
            const embed = new EmbedBuilder().setTitle('🖼️ Welcome GIFs List').setDescription(currentGifs.map((gif, i) => `**${i + 1}.** ${gif}`).join('\n'));
            return ctx.reply({ embeds: [embed] });
        }

        // C. HAPUS GIF
        if (sub === 'rmv') {
            const num = isSlash ? ctx.options.getInteger('number') : parseInt(args[1]);
            if (isNaN(num) || num < 1 || num > currentGifs.length) return ctx.reply('❌ Invalid GIF number!');
            if (currentGifs.length === 1) return ctx.reply('❌ Min 1 GIF required!');

            currentGifs.splice(num - 1, 1);
            settings[guildId].gifs = currentGifs;
            saveSettings(settings);
            return ctx.reply(`✅ Removed GIF #${num}!`);
        }
    }
};
