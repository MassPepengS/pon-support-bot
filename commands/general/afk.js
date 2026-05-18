const fs = require('fs');
const { AFK_FILE } = require('../../config');

module.exports = {
    name: 'afk',
    async executePrefix(message, args) {
        return this.handleAFK(message, args.join(' '), 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.handleAFK(interaction, interaction.options.getString('reason'), 'SLASH');
    },

    async handleAFK(ctx, reasonInput, type) {
        if (!fs.existsSync(AFK_FILE)) fs.writeFileSync(AFK_FILE, JSON.stringify({}));
        const afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));

        const guildId = ctx.guild.id;
        const member = ctx.member;
        const userId = member ? member.id : ctx.user.id;
        const displayName = member ? member.displayName : ctx.user.username;
        const reason = reasonInput || 'AFK';

        if (!afkData[guildId]) afkData[guildId] = {};

        // Simpan data AFK termasuk nama asli untuk di-restore nanti
        afkData[guildId][userId] = {
            reason: reason,
            timestamp: Date.now(),
            originalNick: displayName // Simpan nama asli
        };

        fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2));

        // Ubah nickname jadi [AFK] nama
        if (member && member.manageable) {
            const afkNick = `[AFK] ${displayName}`.slice(0, 32); // Discord max 32 char
            await member.setNickname(afkNick).catch(() => {});
        }

        const msg = `💤 **${displayName}** is now AFK: ${reason}`;

        if (type === 'SLASH') {
            return ctx.reply({ content: msg });
        } else {
            return ctx.reply({ content: msg });
        }
    }
};
