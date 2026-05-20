const { Events } = require('discord.js');
const welcomeHandler = require('../commands/welcome.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        if (welcomeHandler.handleWelcome) {
            await welcomeHandler.handleWelcome(member, client.SETTINGS_FILE);
        }
    },
};
