const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Show the bot command list'),
    
    // COMMAND AFK BARU
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
        .addSubcommand(sub => sub.setName('sug').setDescription('Set target channel for suggestion posts').addChannelOption(opt => opt.setName('channel').setDescription('Select channel').setRequired(true))),

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
    new SlashCommandBuilder().setName('ticket').setDescription('Deploy the Ticket System Panel (Admin Only)'),
    new SlashCommandBuilder().setName('warn').setDescription('Warn a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands INSTANTLY!');
    } catch (error) { console.error(error); }
})();
