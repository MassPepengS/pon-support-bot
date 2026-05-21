const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Show the bot command list')
        .addStringOption(option => option.setName('category').setDescription('Directly open a specific category').setRequired(false)
            .addChoices({ name: 'General', value: 'gen' }, { name: 'Profile', value: 'pro' }, { name: 'Management', value: 'cha' }, { name: 'Moderation', value: 'mod' }, { name: 'Support', value: 'sup' })),

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

    // === ADVANCED PURGE COMMAND ===
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
        
    new SlashCommandBuilder().setName('set').setDescription('Setup features')
        .addSubcommand(sub => sub.setName('wcm').setDescription('Set target welcome channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('log').setDescription('Set target log channel for tickets').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('sug').setDescription('Set target channel for suggestion posts').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('mod').setDescription('Set moderation log channel').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('mute').setDescription('Set restricted role for muted players').addRoleOption(opt => opt.setName('role').setDescription('Select Muted Role').setRequired(true))),
        
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
    new SlashCommandBuilder().setName('suggestion').setDescription('Deploy the Suggestion Panel (Admin Only)')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands...');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands INSTANTLY!');
    } catch (error) { console.error(error); }
})();
