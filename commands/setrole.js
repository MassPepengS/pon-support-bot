const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Daftar kategori yang valid dan sesuai dengan 'rolesetup.js'
const validCategories = {
    'announcements': 'role_announcements',
    'sneakpeaks': 'role_sneakpeaks',
    'updates': 'role_updates',
    'guides': 'role_guides',
    'indonesian': 'role_id',
    'russian': 'role_ru',
    'portuguese': 'role_pt',
    'philippines': 'role_ph',
    'malaysian': 'role_my',
    'espanol': 'role_es',
    'france': 'role_fr',
    'indian': 'role_in',
    'brazil': 'role_br',
    'thailand': 'role_th'
};

module.exports = {
    name: 'setrole',
    description: 'Assign a role to a specific Role Panel category',
    category: 'Channel Management', // <--- TAMBAHKAN BARIS INI
    
    // ==========================================
    // EKSEKUSI VIA PREFIX (pon setrole <kategori> @Role)
    // ==========================================
    async executePrefix(message, args, SETTINGS_FILE) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ **Access Denied:** You do not have the Outpost Commander authority!');
        }

        const categoryInput = args[0]?.toLowerCase();
        const roleMention = message.mentions.roles.first();

        if (!categoryInput || !roleMention) {
            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('🛠️ SETROLE COMMAND USAGE')
                .setDescription(`**Format:** \`${message.client.PREFIX || 'pon'} setrole <category> @Role\`\n\n**Available Categories:**\n\`${Object.keys(validCategories).join('`, `')}\``);
            return message.reply({ embeds: [embed] });
        }

        const databaseKey = validCategories[categoryInput];

        if (!databaseKey) {
            return message.reply(`❌ **Error:** Category \`${categoryInput}\` is not valid. Type \`${message.client.PREFIX || 'pon'} setrole\` to see available categories.`);
        }

        // 🚀 Membaca dan Menyimpan ke Database (Melalui RAM)
        saveToDatabase(message.guild.id, databaseKey, roleMention.id, SETTINGS_FILE || path.join(__dirname, '../../serverSettings.json'), message.client);

        const successEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setDescription(`✅ Successfully linked the **${categoryInput}** category to the <@&${roleMention.id}> role!`);
            
        return message.reply({ embeds: [successEmbed] });
    },

    // ==========================================
    // EKSEKUSI VIA SLASH COMMAND (/setrole)
    // ==========================================
    async executeSlash(interaction, args, SETTINGS_FILE) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ **Access Denied:** You do not have the Outpost Commander authority!', ephemeral: true });
        }

        // Karena kamu memakai custom command handler, biasanya args untuk slash ditarik seperti ini
        const categoryInput = interaction.options.getString('category');
        const roleInput = interaction.options.getRole('role');

        const databaseKey = validCategories[categoryInput];

        if (!databaseKey) {
            return interaction.reply({ content: '❌ **Error:** Invalid category selected!', ephemeral: true });
        }

        // 🚀 Membaca dan Menyimpan ke Database (Melalui RAM)
        saveToDatabase(interaction.guild.id, databaseKey, roleInput.id, SETTINGS_FILE || path.join(__dirname, '../../serverSettings.json'), interaction.client);

        const successEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setDescription(`✅ Successfully linked the **${categoryInput}** category to the <@&${roleInput.id}> role!`);
            
        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
};

// ==========================================
// 🚀 FUNGSI PENYIMPAN DATABASE AMAN (FULL-RAM & ANTI-LAG)
// ==========================================
function saveToDatabase(guildId, key, roleId, filePath, client) {
    // 1. Tarik dari Mesin RAM (Anti-Lag & Sinkron dengan file lain)
    const guildSettings = client.checkDatabase(guildId);

    // 2. Simpan ID Role ke kunci dinamis yang diminta
    guildSettings[key] = roleId;

    // 3. Tulis ulang file JSON secara asinkron (Mode Background)
    fs.writeFile(filePath, JSON.stringify(client.databaseCache, null, 4), (err) => {
        if (err) console.error('Error saving setrole:', err);
    });
}