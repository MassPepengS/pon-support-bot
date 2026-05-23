const { Events } = require('discord.js');
const welcomeHandler = require('../commands/welcome.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // 1. AUTO-ROLE UNVERIFIED (Langsung pasang borgol saat baru masuk)
        const settings = client.checkDatabase(member.guild.id);
        const unverifiedRoleId = settings[member.guild.id]?.unverifiedRoleId;
        
        if (unverifiedRoleId) {
            const unvRole = member.guild.roles.cache.get(unverifiedRoleId);
            if (unvRole) await member.roles.add(unvRole).catch(()=>{});
        }

        // 2. WELCOME SYSTEM
        if (welcomeHandler.handleWelcome) {
            await welcomeHandler.handleWelcome(member, client.SETTINGS_FILE);
        }
    },
};
