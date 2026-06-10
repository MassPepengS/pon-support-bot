const fs = require('fs');

module.exports = {
    name: 'afk',
    async executePrefix(message, args) {
        return this.handleAFK(message, args.join(' '), 'PREFIX');
    },
    async executeSlash(interaction) {
        return this.handleAFK(interaction, interaction.options.getString('reason'), 'SLASH');
    },

    async handleAFK(ctx, reasonInput, type) {
        const AFK_FILE = './afk.json';
        
        // Membaca file dengan aman
        let afkData = {};
        if (fs.existsSync(AFK_FILE)) {
            try {
                afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
            } catch (e) {
                console.error("⚠️ Gagal membaca afk.json:", e);
            }
        }
        
        const guildId = ctx.guild.id;
        const userId = ctx.member ? ctx.member.id : ctx.user.id;
        const displayName = ctx.member ? ctx.member.displayName : ctx.user.username;
        const reason = reasonInput || 'AFK';
        
        if (!afkData[guildId]) afkData[guildId] = {};
        
        afkData[guildId][userId] = {
            reason: reason,
            timestamp: Date.now() // Untuk hitung mundur waktu AFK
        };
        
        // 🚀 PERBARUAN: Menyimpan secara Asinkron (Latar Belakang) agar Anti-Lag
        fs.writeFile(AFK_FILE, JSON.stringify(afkData, null, 2), (err) => {
            if (err) console.error('⚠️ [ERROR] Gagal menyimpan data AFK:', err);
        });
        
        const msg = `💤 **${displayName}** is now AFK: ${reason}`;
        
        if (type === 'SLASH') {
            return ctx.reply({ content: msg });
        } else {
            return ctx.reply({ content: msg });
        }
    }
};