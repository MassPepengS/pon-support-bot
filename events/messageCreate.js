const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const { PREFIX, AFK_FILE, SETTINGS_FILE } = require('../config');
const { checkDatabase, saveSettings } = require('../utils/database');
const { checkCooldown } = require('../utils/cooldown');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // ==================== AUTOMOD ====================
        const guildId  = message.guild.id;
        const settings = checkDatabase(guildId);
        const badWords = settings[guildId]?.badWords || [];
        const content  = message.content.toLowerCase();

        const sendAutoModLog = async (reason, originalContent) => {
            let logChannel;
            if (settings[guildId]?.modLogChannelId) {
                logChannel = message.guild.channels.cache.get(settings[guildId].modLogChannelId);
            }
            if (!logChannel) {
                logChannel = message.guild.channels.cache.find(c =>
                    c.name === 'haven-moderation' || c.name === 'moderation-logs' || c.name === 'mod-logs'
                );
            }
            if (!logChannel) return;

            const now = new Date();
            const dateStr = `${now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

            if (!settings[guildId].caseCount) settings[guildId].caseCount = 0;
            settings[guildId].caseCount += 1;
            const caseId = settings[guildId].caseCount.toString().padStart(6, '0');
            saveSettings(settings);

            const logEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setAuthor({ name: `${message.author.username} | AutoMod`, iconURL: message.author.displayAvatarURL() })
                .setDescription(
                    `**USER**\n${message.author} | ${message.author.username}\n` +
                    `**CHANNEL**\n${message.channel}\n` +
                    `**STAFF**\nAutoMod\n` +
                    `**REASON**\n${reason}\n` +
                    `**MESSAGE CONTENT**\n\`\`\`${originalContent.slice(0, 500)}\`\`\`\n` +
                    `CASE ID: ${caseId} | ${dateStr}`
                );
            await logChannel.send({ embeds: [logEmbed] });
        };

        // 1. Filter Kata Dinamis
        if (badWords.length > 0) {
            const hasBadWord = badWords.some(word => content.includes(word.toLowerCase()));
            if (hasBadWord) {
                await message.delete().catch(() => {});
                const warningMsg = await message.channel.send(`⚠️ ${message.author}, please mind your language!`);
                setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
                await sendAutoModLog('Triggered Word Filter', message.content);
                return;
            }
        }

        // 2. Filter Link
        const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        if (linkRegex.test(content) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send(`🔗 ${message.author}, sending links is not allowed in this server!`);
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            await sendAutoModLog('Posted a Link', message.content);
            return;
        }

        // 3. Filter Caps Lock
        if (message.content.length > 15) {
            const capsCount = message.content.replace(/[^A-Z]/g, '').length;
            const capsPercentage = (capsCount / message.content.length) * 100;
            if (capsPercentage > 70 && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                await message.delete().catch(() => {});
                const warningMsg = await message.channel.send(`🔠 ${message.author}, please turn off your Caps Lock!`);
                setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
                await sendAutoModLog('Excessive Caps Lock', message.content);
                return;
            }
        }

        // ==================== AFK SYSTEM ====================
        if (!fs.existsSync(AFK_FILE)) fs.writeFileSync(AFK_FILE, JSON.stringify({}));
        let afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
        let afkChanged = false;

        if (afkData[guildId] && afkData[guildId][message.author.id]) {
            const afkInfo = afkData[guildId][message.author.id];
            delete afkData[guildId][message.author.id];
            afkChanged = true;

            // Restore nickname asli
            if (message.member && message.member.manageable && afkInfo.originalNick) {
                // Kalau originalNick sama dengan username, set null (hapus nickname)
                const restoreNick = afkInfo.originalNick === message.author.username ? null : afkInfo.originalNick;
                message.member.setNickname(restoreNick).catch(() => {});
            }

            message.channel
                .send(`👋 Welcome back **${message.member.displayName}**, I removed your AFK.`)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
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

        // ==================== PREFIX COMMAND DISPATCH ====================
        const originalTrimmed = message.content.trim();
        const contentLower2 = originalTrimmed.toLowerCase();
        if (!contentLower2.startsWith(PREFIX.toLowerCase())) return;

        const args = originalTrimmed.slice(PREFIX.length).trim().split(/\s+/);
        if (args.length === 0) return;

        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (!command || !command.executePrefix) return;

        // Cooldown check (3 detik per user per command)
        const remaining = checkCooldown(message.author.id, commandName, 3);
        if (remaining) {
            const cdMsg = await message.channel.send(`⏳ ${message.author}, please wait **${remaining}s** before using this command again.`);
            setTimeout(() => cdMsg.delete().catch(() => {}), 3000);
            return;
        }

        // Reuse settings yang sudah di-load di atas
        const guildSettings = settings;
        const isRealAdmin = message.member
            ? message.member.permissions.has(PermissionFlagsBits.ManageGuild)
            : false;
        const isCustomAdmin = guildSettings[guildId].authorizedUsers.includes(message.author.id);

        // Agar command prefix kirim pesan ke channel (bukan reply thread)
        const prefixCtx = Object.create(message);
        prefixCtx.reply = (content) => message.channel.send(content);

        try {
            await command.executePrefix(prefixCtx, args, SETTINGS_FILE, guildSettings, isRealAdmin, isCustomAdmin);
        } catch (error) {
            console.error(`[Prefix Error] ${commandName}:`, error);
            message.channel.send('❌ Something went wrong while executing this command.').catch(() => {});
        }
    }
};
