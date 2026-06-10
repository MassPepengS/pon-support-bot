const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [

    new SlashCommandBuilder().setName('likes').setDescription('Give a like to another player\'s RPG profile')
        .addUserOption(opt => opt.setName('user').setDescription('Select a player').setRequired(true)),
    new SlashCommandBuilder().setName('unlikes').setDescription('Remove your like from another player\'s RPG profile')
        .addUserOption(opt => opt.setName('user').setDescription('Select a player').setRequired(true)),

    new SlashCommandBuilder().setName('delalbum').setDescription('Remove the custom album image from your RPG profile'),

    new SlashCommandBuilder().setName('gamertag').setDescription('Set your in-game Gamertag')
        .addStringOption(opt => opt.setName('name').setDescription('Your in-game name').setRequired(true)),
    new SlashCommandBuilder().setName('clan').setDescription('Choose and join an official Clan in the Outpost'),
    new SlashCommandBuilder().setName('album').setDescription('Set a custom image for your profile album')
        .addAttachmentOption(opt => opt.setName('image').setDescription('Upload an image/screenshot').setRequired(true)),

    new SlashCommandBuilder().setName('profile').setDescription('View your or another player\'s RPG Profile')
        .addUserOption(opt => opt.setName('user').setDescription('Select a user to view their profile (Optional)').setRequired(false)),

    new SlashCommandBuilder().setName('help').setDescription('Show the bot command list')
        .addStringOption(option => option.setName('category').setDescription('Directly open a specific category').setRequired(false)
            .addChoices({ name: 'General', value: 'gen' }, { name: 'Progress', value: 'pro' }, { name: 'Management', value: 'cha' }, { name: 'Moderation', value: 'mod' }, { name: 'Support', value: 'sup' })),

    // === GENERAL COMMANDS ===
    new SlashCommandBuilder().setName('avatar').setDescription('Display a user\'s avatar')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(false)),
    new SlashCommandBuilder().setName('meme').setDescription('Get a random fresh meme from Reddit'),
    new SlashCommandBuilder().setName('dog').setDescription('Summon a random cute dog image'),
    new SlashCommandBuilder().setName('cat').setDescription('Summon a random cute cat image'),

    // === MODERATION COMMANDS ===
    new SlashCommandBuilder().setName('kick').setDescription('Kick a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('ban').setDescription('Ban a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('tempban').setDescription('Temporarily ban a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Time format: 1d, 12h, 30m, 60s').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('unban').setDescription('Unban a player using their ID')
        .addStringOption(opt => opt.setName('userid').setDescription('The User ID to unban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('warn').setDescription('Warn a player (3x = Auto Mute 1 Day)')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('unwarn').setDescription('Remove a warning from a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('clearwarn').setDescription('Reset all warnings to 0 & lift auto-mute')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('history').setDescription('Lookup moderation history of a user')
        .addUserOption(opt => opt.setName('user').setDescription('Select user to lookup').setRequired(false)),

    new SlashCommandBuilder().setName('purge').setDescription('Advanced purge messages with options')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption(opt => opt.setName('user').setDescription('Filter by specific user').setRequired(false))
        .addStringOption(opt => opt.setName('filter').setDescription('Filter by message type').setRequired(false)
            .addChoices({ name: 'Links Only', value: 'links' })),

    new SlashCommandBuilder().setName('mute').setDescription('Mute a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Time format: 1d, 12h, 30m, 60s').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    new SlashCommandBuilder().setName('unmute').setDescription('Unmute a player')
        .addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

    // === MANAGEMENT & UTILITIES ===
    new SlashCommandBuilder().setName('afk').setDescription('Set your status to AFK')
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for being AFK').setRequired(false)),

    new SlashCommandBuilder().setName('crt').setDescription('Channel, Category, and Role management')
        .addSubcommand(sub => sub.setName('cha').setDescription('Create a text channel').addStringOption(opt => opt.setName('name').setDescription('Channel name').setRequired(true)))
        .addSubcommand(sub => sub.setName('cat').setDescription('Create a category').addStringOption(opt => opt.setName('name').setDescription('Category name').setRequired(true)))
        .addSubcommand(sub => sub.setName('in').setDescription('Create a channel inside a category').addStringOption(opt => opt.setName('category_id').setDescription('The Category ID').setRequired(true)).addStringOption(opt => opt.setName('name').setDescription('Channel name').setRequired(true)))
        .addSubcommand(sub => sub.setName('role').setDescription('Create a role').addStringOption(opt => opt.setName('hex').setDescription('Hex Color (e.g., #FF0000)').setRequired(true)).addStringOption(opt => opt.setName('name').setDescription('Role Name').setRequired(true))),

    new SlashCommandBuilder().setName('rmv').setDescription('Delete a channel, category, role, or messages')
        .addSubcommand(sub => sub.setName('cha').setDescription('Delete a text channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('cat').setDescription('Delete a category').addStringOption(opt => opt.setName('name').setDescription('Category name').setRequired(true)))
        .addSubcommand(sub => sub.setName('role').setDescription('Delete a role').addRoleOption(opt => opt.setName('role').setDescription('Select role').setRequired(true)))
        .addSubcommand(sub => sub.setName('msg').setDescription('Delete multiple messages').addIntegerOption(opt => opt.setName('amount').setDescription('Amount of messages to delete').setRequired(true))),

    // === UPDATED SET COMMAND (GIFT & LEVEL ADDED) ===
    new SlashCommandBuilder().setName('set').setDescription('Setup features')
        .addSubcommand(sub => sub.setName('wcm').setDescription('Set target welcome channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('log').setDescription('Set target log channel for tickets').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('sug').setDescription('Set target channel for suggestion posts').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('mod').setDescription('Set moderation log channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('mute').setDescription('Set restricted role for muted players').addRoleOption(opt => opt.setName('role').setDescription('Select Muted Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('gift').setDescription('Set target channel for random item drops').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('level').setDescription('Set target channel for Level Up notifications').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true))),

    new SlashCommandBuilder().setName('wcm').setDescription('Manage welcome GIFs')
        .addSubcommand(sub => sub.setName('gif').setDescription('Add custom Imgur GIF').addStringOption(opt => opt.setName('link').setDescription('Imgur link').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all welcome GIFs'))
        .addSubcommand(sub => sub.setName('rmv').setDescription('Remove a custom GIF by its number').addIntegerOption(opt => opt.setName('number').setDescription('GIF number').setRequired(true))),

    new SlashCommandBuilder().setName('access').setDescription('Manage custom bot permissions')
        .addSubcommand(sub => sub.setName('add').setDescription('Grant bot command access').addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true)))
        .addSubcommand(sub => sub.setName('rmv').setDescription('Revoke bot command access').addUserOption(opt => opt.setName('user').setDescription('Select user').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('View authorized bot admins')),

    new SlashCommandBuilder().setName('info').setDescription('View bot statistics, ping, and system info'),
    new SlashCommandBuilder().setName('lock').setDescription('Lock a channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(false)),
    new SlashCommandBuilder().setName('unlock').setDescription('Unlock a channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(false)),
    new SlashCommandBuilder().setName('slowmode').setDescription('Set channel slowmode').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)).addIntegerOption(opt => opt.setName('seconds').setDescription('Slowmode in seconds').setRequired(true)),
    new SlashCommandBuilder().setName('suggestion').setDescription('Deploy the Suggestion Panel (Admin Only)'),
    new SlashCommandBuilder().setName('rolesetup').setDescription('Deploy the Server & Language Roles Panel (Admin Only)'),

    // === NEW SETROLE COMMAND ===
    new SlashCommandBuilder().setName('setrole').setDescription('Assign a role to a specific Role Panel category (Admin Only)')
        .addStringOption(opt => opt.setName('category').setDescription('Select the panel category').setRequired(true)
            .addChoices(
                { name: 'Announcements', value: 'announcements' },
                { name: 'Sneak Peaks', value: 'sneakpeaks' },
                { name: 'Updates', value: 'updates' },
                { name: 'Guides', value: 'guides' },
                { name: 'Indonesian', value: 'indonesian' },
                { name: 'Russian', value: 'russian' },
                { name: 'Portuguese', value: 'portuguese' },
                { name: 'Philippines', value: 'philippines' },
                { name: 'Malaysian', value: 'malaysian' },
                { name: 'Español', value: 'espanol' },
                { name: 'France', value: 'france' },
                { name: 'Indian', value: 'indian' },
                { name: 'Brazil', value: 'brazil' },
                { name: 'Thailand', value: 'thailand' }
            ))
        .addRoleOption(opt => opt.setName('role').setDescription('Select the role to link').setRequired(true)),

    new SlashCommandBuilder().setName('verifysetup').setDescription('Setup the CAPTCHA Verification System')
        .addRoleOption(opt => opt.setName('unverified').setDescription('Role given automatically to new members').setRequired(true))
        .addRoleOption(opt => opt.setName('verified').setDescription('Role given after passing CAPTCHA').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Target channel to deploy the panel').setRequired(true)),

    // === THE UPDATED ANNOUNCE COMMAND (FLEXIBLE OPTIONS) ===
    new SlashCommandBuilder().setName('announce').setDescription('Send an official announcement to a channel (Admin Only)')
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel where the announcement will be sent').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('The title of the announcement (Optional)').setRequired(false))
        .addStringOption(opt => opt.setName('message').setDescription('The announcement text (Type \\n for a new line/enter) (Optional)').setRequired(false))
        .addAttachmentOption(opt => opt.setName('image').setDescription('Attach a main image for the announcement (Optional)').setRequired(false))
        .addAttachmentOption(opt => opt.setName('thumbnail').setDescription('Attach a small thumbnail image for the top right corner (Optional)').setRequired(false))
        .addStringOption(opt => opt.setName('ping').setDescription('Tag someone or @everyone (Optional - placed outside embed to trigger ping)').setRequired(false)),

    // === SCHEDULE COMMAND ===
    new SlashCommandBuilder().setName('schedule').setDescription('Schedule an announcement for a later time (Admin Only)')
        .addStringOption(opt => opt.setName('delay').setDescription('Time delay (e.g., 10m, 12h, 1d)').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel where the announcement will be sent').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Title (Optional)').setRequired(false))
        .addStringOption(opt => opt.setName('message').setDescription('Message (Type \\n for enter) (Optional)').setRequired(false))
        .addAttachmentOption(opt => opt.setName('image').setDescription('Main image (Optional)').setRequired(false))
        .addAttachmentOption(opt => opt.setName('thumbnail').setDescription('Small thumbnail (Optional)').setRequired(false))
        .addStringOption(opt => opt.setName('ping').setDescription('Tag @everyone (Optional)').setRequired(false)),

    new SlashCommandBuilder().setName('fixverify').setDescription('Sync verification roles for older members (Admin Only)')
        .addRoleOption(opt => opt.setName('unverified_role').setDescription('The role for unverified members').setRequired(true))
        .addRoleOption(opt => opt.setName('verified_role').setDescription('The role for verified members').setRequired(true)),

    // TAMBAHKAN BLOK ANTI-INVITE INI
    new SlashCommandBuilder().setName('antiinvite').setDescription('Toggle the Anti-Invite shield (Admin Only)')
        .addStringOption(opt => opt.setName('mode').setDescription('Turn the shield ON or OFF').setRequired(true)
            .addChoices({ name: 'ON (Block Invites)', value: 'on' }, { name: 'OFF (Allow Invites)', value: 'off' })),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands...');

        // 1. ANNIHILATE GLOBAL COMMANDS (This fixes the duplicate issue)
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('✅ Successfully deleted all global commands (Clones eradicated)!');

        // 2. RE-DEPLOY GUILD COMMANDS
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Successfully reloaded application (/) commands INSTANTLY!');
    } catch (error) { console.error(error); }
})();