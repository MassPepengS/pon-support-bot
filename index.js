require('dotenv').config();
const {
    Client, GatewayIntentBits, PermissionFlagsBits, Collection, ChannelType,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType
} = require('discord.js');
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

const PREFIX = 'pon';
const SETTINGS_FILE = './serverSettings.json';
const AFK_FILE = './afk.json';

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('name' in command) client.commands.set(command.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}));
if (!fs.existsSync(AFK_FILE)) fs.writeFileSync(AFK_FILE, JSON.stringify({}));

function checkDatabase(guildId) {
    let settings = {};
    try { settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { settings = {}; }
    let changed = false;

    if (!settings[guildId] || typeof settings[guildId] === 'string') {
        settings[guildId] = { channelId: null, gifs: [], authorizedUsers: [], logChannelId: null, suggestionChannelId: null, modLogChannelId: null, badWords: [], caseCount: 0, warns: {}, linkAllowedChannels: [] };
        changed = true;
    }
    if (!settings[guildId].badWords) { settings[guildId].badWords = []; changed = true; }
    if (!Array.isArray(settings[guildId].authorizedUsers)) { settings[guildId].authorizedUsers = []; changed = true; }
    if (!Array.isArray(settings[guildId].linkAllowedChannels)) { settings[guildId].linkAllowedChannels = []; changed = true; }
    
    if (changed) fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return settings;
}

client.once('clientReady', () => {
    console.log(`Success! Bot ${client.user.tag} is online & ready!`);
    client.user.setActivity({ type: ActivityType.Custom, name: 'custom', state: 'Support, 24/7' });
});

const welcomeHandler = require('./commands/welcome.js');
client.on('guildMemberAdd', async member => {
    if (welcomeHandler.handleWelcome) await welcomeHandler.handleWelcome(member, SETTINGS_FILE);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        const reason = interaction.values[0];
        const member = interaction.member;
        const guild = interaction.guild;

        try {
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
                ]
            });
            await interaction.reply({ content: `✅ Signal received! Head over to your private channel: ${ticketChannel}`, ephemeral: true });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#77B255')
                .setTitle('🏕️ DISTRESS SIGNAL OPENED')
                .setDescription(`Welcome to your private channel, <@${member.id}>.\n\n**Category:** ${reason.toUpperCase()}\n\nPlease describe your issue clearly and provide any evidence/screenshots if needed. An Outpost Commander will be with you shortly.`)
                .setFooter({ text: 'Press the lock button below to close this ticket.' });
            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket & Save Log').setStyle(ButtonStyle.Danger).setEmoji('🔒');
            await ticketChannel.send({ content: `<@${member.id}>`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
        } catch (error) { await interaction.reply({ content: '❌ Failed to deploy ticket channel!', ephemeral: true }); }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        try {
            await interaction.reply('🔒 Securing data logs and dismantling channel in 5 seconds...');
            const channel = interaction.channel;
            const guildId = interaction.guild.id;
            const settings = checkDatabase(guildId);
            const logChannelId = settings[guildId]?.logChannelId;

            const messages = await channel.messages.fetch({ limit: 100 });
            const transcriptArray = Array.from(messages.values()).reverse().map(m => {
                const d = new Date(m.createdTimestamp);
                const safeDate = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
                return `[${safeDate}] ${m.author.tag}: ${m.content} ${m.attachments.size > 0 ? '(Attachment Included)' : ''}`;
            });

            const transcriptText = transcriptArray.join('\n');
            const buffer = Buffer.from(transcriptText, 'utf8');
            const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-log.txt` });

            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const embedLog = new EmbedBuilder().setColor('#2F3136').setTitle('🎫 TICKET CLOSED & LOGGED').setDescription(`**Ticket:** ${channel.name}\n**Closed By:** <@${interaction.user.id}>`).setTimestamp();
                    await logChannel.send({ embeds: [embedLog], files: [attachment] });
                }
            }
            setTimeout(() => { channel.delete().catch(console.error); }, 5000);
        } catch (err) { await interaction.followUp({ content: '❌ Error closing ticket.', ephemeral: true }).catch(()=>{}); }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'create_suggestion') {
        const modal = new ModalBuilder().setCustomId('suggestion_modal').setTitle('Submit a Suggestion');
        const suggestionInput = new TextInputBuilder().setCustomId('suggestion_text').setLabel("What is your idea?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
        modal.addComponents(new ActionRowBuilder().addComponents(suggestionInput));
        await interaction.showModal(modal);
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'suggestion_modal') {
        const suggestionText = interaction.fields.getTextInputValue('suggestion_text');
        const guildId = interaction.guild.id;
        const settings = checkDatabase(guildId);
        const targetChannelId = settings[guildId]?.suggestionChannelId;
        const targetChannel = targetChannelId ? interaction.guild.channels.cache.get(targetChannelId) : interaction.channel;

        if (!targetChannel) return interaction.reply({ content: '❌ Target channel error!', ephemeral: true });

        const suggestionEmbed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setAuthor({ name: `${interaction.user.tag} suggests:`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`**Suggestion:**\n${suggestionText}`)
            .setTimestamp()
            .setFooter({ text: 'Vote below! ⬆️ for Yes, ⬇️ for No' });

        try {
            const suggestionMsg = await targetChannel.send({ embeds: [suggestionEmbed] });
            await suggestionMsg.react('⬆️');
            await suggestionMsg.react('⬇️');
            if (interaction.message) await interaction.message.delete().catch(() => {});

            const panelEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('💡 PIONEER IDEAS & SUGGESTIONS')
                .setDescription('Have a thought that could make **Pioneer Outpost Nusa** even greater? Share it with the community!\n\n• Click the button below to submit your suggestion.\n• The community can vote using ⬆️ and ⬇️ reactions.\n• Highly voted ideas will be reviewed and possibly implemented by the Outpost Commanders.\n\n*Help us build a better world!*')
                .setImage('https://i.imgur.com/feJtRAt.gif');

            const btn = new ButtonBuilder().setCustomId('create_suggestion').setLabel('CREATE SUGGESTION').setStyle(ButtonStyle.Primary).setEmoji('📝');
            await interaction.channel.send({ embeds: [panelEmbed], components: [new ActionRowBuilder().addComponents(btn)] });
            await interaction.reply({ content: `✅ Your suggestion has been sent to ${targetChannel}!`, ephemeral: true });
        } catch (error) { await interaction.reply({ content: '❌ Failed to submit suggestion.', ephemeral: true }).catch(()=>{}); }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
        const selection = interaction.values[0];
        const embed = new EmbedBuilder().setTimestamp();
        const p = PREFIX;

        const emojisPath = path.join(__dirname, 'emojis.json');
        let emojis = { help_main: '🏕️', help_general: '🧭', help_profile: '👤', help_management: '🧱', help_support: '🛠️', help_moderation: '🛡️' };
        if (fs.existsSync(emojisPath)) emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

        const getEmoji = (emojiStr, fallback) => {
            if (!emojiStr) return fallback;
            const match = String(emojiStr).match(/\d+/);
            if (match && interaction.guild) {
                const guildEmoji = interaction.guild.emojis.cache.get(match[0]);
                if (guildEmoji) return guildEmoji.toString();
            }
            return emojiStr;
        };

        switch (selection) {
            case 'help_main':
                embed.setColor('#2F3136')
                    .setTitle('🏕️ PIONEER OUTPOST HELP PANEL')
                    .setDescription('Welcome Explorer! Select a category from the dropdown menu below to view available commands and server configurations.')
                    .addFields(
                        { name: `${getEmoji(emojis.help_general, '🧭')} General`, value: 'Basic bot interactions, user utilities, and AFK systems.', inline: true },
                        { name: `${getEmoji(emojis.help_profile, '👤')} Profile`, value: 'View player statistics, titles, badges, gamble and games. *(Coming Soon)*', inline: true },
                        { name: `${getEmoji(emojis.help_management, '🧱')} Ch Management & Welcome`, value: 'Tools for channel, role, locks, custom greetings, logs, and suggestions.', inline: true },
                        { name: `${getEmoji(emojis.help_moderation, '🛡️')} Moderation`, value: 'Word filters and auto-moderation tools.', inline: true },
                        { name: `${getEmoji(emojis.help_support, '🛠️')} Support & Utilities`, value: 'Configure custom bot access and administrator rights.', inline: true }
                    )
                    .setFooter({ text: 'Pioneer Support • Choose a category below' });
                break;
            case 'help_moderation':
                embed.setColor('#2F3136')
                    .setTitle(`${getEmoji(emojis.help_moderation, '🛡️')} MODERATION PANEL`)
                    .setDescription('Tools to keep your outpost safe and clean from violations:')
                    .addFields(
                        { name: '📝 Word Filter System', value: `\`${p} word add [word]\` - Add a word to the filter list.\n\`${p} word rmv [word]\` - Remove a word from the filter.\n\`${p} word list\` - View all filtered words.` },
                        { name: '🔗 Link Control System', value: `\`${p} link allow [#channel]\` - Allow links in a channel.\n\`${p} link block [#channel]\` - Block links back.\n\`${p} link list\` - View allowed link channels.` }
                    )
                    .setFooter({ text: 'Category: Moderation (Admin Only)' });
                break;
            case 'help_general':
                embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_general, '🧭')} GENERAL BOT COMMANDS`).setDescription('Here are the basic commands available for all server members:').addFields({ name: `\`${p} afk [reason]\``, value: 'Set your status to Away From Keyboard (AFK).' },{ name: `\`${p} info\``, value: 'View bot statistics, current ping, and system uptime.' },{ name: `\`${p} avatar [user]\``, value: 'Display your own or another member\'s high-resolution avatar.' },{ name: `\`${p} vote\``, value: 'Support our outpost by voting for the bot on community lists.' },{ name: `\`${p} dog / cat\``, value: 'Summon a random cute dog or cat image.' },{ name: `\`${p} meme\``, value: 'Get a random fresh meme from Reddit.' }).setFooter({ text: 'Category: General Commands' });
                break;
            case 'help_profile':
                embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_profile, '👤')} PLAYER PROFILE SYSTEM`).setDescription('📋 **STATUS: COMING SOON**\n\nThis feature is currently under heavy development by the Outpost Commanders.\n\nSoon you will be able to earn customized **Badges**, unlock legendary **Titles**, level up by chatting, and compete on the global server **Leaderboard**!').setFooter({ text: 'Category: Profile & Ranks' });
                break;
            case 'help_management':
                embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_management, '🧱')} CH MANAGEMENT & WELCOME SETUP`).setDescription('Configuration commands to control, structure channels, setup greetings, and logs:').addFields({ name: '🧱 Channel & Role Management', value: `\`${p} crt cha [name]\` - Create text channel.\n\`${p} crt cat [name]\` - Create category folder.\n\`${p} crt role [hex] [name]\` - Create custom colored role.\n\`${p} rmv [cha/cat/role]\` - Delete channel/category/role.\n\`${p} rmv msg [amount]\` - Clear chat messages.\n\`${p} lock / unlock [channel]\` - Toggle channel locks.\n\`${p} slowmode [channel] [seconds]\` - Set slowmode cooldown.` },{ name: '👋 Welcome Greeting Configurations', value: `\`${p} set wcm [#channel]\` - Set target welcome channel.\n\`${p} wcm gif [imgur_link]\` - Pool custom background Imgur GIF.\n\`${p} wcm list\` - View registered welcome GIFs.\n\`${p} wcm rmv [num]\` - Remove custom GIF from database.` },{ name: '📝 Ticket & Suggestion Logs', value: `\`${p} set log [#channel]\` - Set archive log channel for closed tickets.\n\`${p} set sug [#channel]\` - Set community suggestion channel.\n\`${p} suggestion\` - Deploy Suggestion Embed Panel.` }).setFooter({ text: 'Category: Management & Welcome (Admin Only)' });
                break;
            case 'help_support':
                embed.setColor('#2F3136').setTitle(`${getEmoji(emojis.help_support, '🛠️')} SUPPORT & UTILITIES PANEL`).setDescription('Core configuration tools for advanced bot access modules:').addFields({ name: `\`${p} access add / rmv [@user]\``, value: 'Grant or revoke custom admin permissions to run bot commands.' },{ name: `\`${p} access list\``, value: 'Display all authorized custom bot administrators.' }).setFooter({ text: 'Category: Support & Utilities (Admin Only)' });
                break;
        }
        await interaction.update({ embeds: [embed] }).catch(()=>{});
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    const settings = checkDatabase(interaction.guild.id);
    const isRealAdmin = interaction.member ? interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) : false;
    const isCustomAdmin = settings[interaction.guild.id].authorizedUsers.includes(interaction.user.id);
    try { await command.executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin); } 
    catch (error) { console.error(error); }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const settings = checkDatabase(guildId);
    const contentLower = message.content.toLowerCase();
    const contentRaw = message.content;

    const badWords = settings[guildId].badWords || [];
    const allowedLinkChannels = settings[guildId].linkAllowedChannels || [];
    const isLinkAllowedChannel = allowedLinkChannels.includes(message.channel.id);
    const isCommand = contentLower.startsWith(`${PREFIX.toLowerCase()} `);
    let isViolating = false;

    const sendAutoModLog = async (reason, originalContent) => {
        let logChannelId = settings[guildId].modLogChannelId;
        let logChannel = logChannelId ? message.guild.channels.cache.get(logChannelId) : message.guild.channels.cache.find(c => c.name.includes('mod'));
        if (logChannel) {
            settings[guildId].caseCount = (settings[guildId].caseCount || 0) + 1;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            const caseId = settings[guildId].caseCount.toString().padStart(6, '0');
            const logEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setAuthor({ name: `${message.author.username} | AutoMod`, iconURL: message.author.displayAvatarURL() })
                .setDescription(`**USER**\n${message.author} | ${message.author.username}\n**STAFF**\nAutoMod\n**REASON**\n${reason}\n**MESSAGE CONTENT**\n${originalContent}\n\nCASE ID: ${caseId}`);
            logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
        }
    };

    if (!isCommand && badWords.length > 0) {
        const safeWords = badWords.map(w => w.trim().toLowerCase()).filter(w => w !== '');
        const hasBadWord = safeWords.some(word => contentLower.includes(word));
        if (hasBadWord) {
            await message.delete().catch(()=>{});
            message.channel.send(`⚠️ ${message.author}, Please, mind your language!`)
                .then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
            sendAutoModLog('Triggered Word Filter', contentRaw);
            isViolating = true;
        }
    }

    // UPDATE: Filter Link sekarang akan BYPASS (mengabaikan) jika channel tersebut ada di daftar yang diizinkan!
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    if (!isViolating && !isCommand && !isLinkAllowedChannel && linkRegex.test(contentLower) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await message.delete().catch(()=>{});
        message.channel.send(`🔗 ${message.author}, sending links is not allowed in this channel!`)
            .then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
        sendAutoModLog('Posted a Link', contentRaw);
        isViolating = true;
    }

    if (!isViolating && !isCommand && contentRaw.length > 15 && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const capsCount = contentRaw.replace(/[^A-Z]/g, '').length;
        if ((capsCount / contentRaw.length) * 100 > 70) {
            await message.delete().catch(()=>{});
            message.channel.send(`🔠 ${message.author}, please turn off your Caps Lock!`)
                .then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
            sendAutoModLog('Excessive Caps Lock', contentRaw);
            isViolating = true;
        }
    }

    if (isViolating) return;

    let afkData = {};
    try { afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8')); } catch (e) {}
    let afkChanged = false;

    if (afkData[guildId] && afkData[guildId][message.author.id]) {
        delete afkData[guildId][message.author.id];
        afkChanged = true;
        message.channel.send(`👋 Welcome back **${message.member.displayName}**, I removed your AFK.`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000));
    }

    if (message.mentions.users.size > 0 && afkData[guildId]) {
        message.mentions.users.forEach(user => {
            if (afkData[guildId][user.id]) {
                const afkInfo = afkData[guildId][user.id];
                const timeAgo = Math.floor(afkInfo.timestamp / 1000);
                message.channel.send(`💤 **${user.username}** is AFK: ${afkInfo.reason} *(since <t:${timeAgo}:R>)*`);
            }
        });
    }

    if (afkChanged) fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2));

    if (!contentLower.startsWith(PREFIX.toLowerCase())) return;
    const args = contentRaw.slice(PREFIX.length).trim().split(/\s+/);
    if (args.length === 0) return;

    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    const isRealAdmin = message.member ? message.member.permissions.has(PermissionFlagsBits.ManageGuild) : false;
    const isCustomAdmin = settings[guildId].authorizedUsers.includes(message.author.id);
    
    message.reply = (content) => message.channel.send(content);

    try { await command.executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin); } 
    catch (error) { console.error(error); }
});

client.login(process.env.TOKEN);
