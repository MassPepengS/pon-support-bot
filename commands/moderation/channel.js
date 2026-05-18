const { PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'crt',
    async executePrefix(message, args, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        return this.handleCreate(message, args, 'PREFIX', isRealAdmin, isCustomAdmin);
    },
    async executeSlash(interaction, SETTINGS_FILE, settings, isRealAdmin, isCustomAdmin) {
        return this.handleCreate(interaction, null, 'SLASH', isRealAdmin, isCustomAdmin);
    },

    async handleCreate(ctx, args, type, isRealAdmin, isCustomAdmin) {
        const isSlash = type === 'SLASH';
        const guild = ctx.guild;
        const hasPerms = ctx.member
            ? ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)
            : false;

        if (!hasPerms && !isRealAdmin && !isCustomAdmin) {
            return isSlash
                ? ctx.reply({ content: '❌ No permission!', ephemeral: true })
                : ctx.reply('❌ No permission!');
        }

        const sub = isSlash ? ctx.options.getSubcommand() : (args[0] ? args[0].toLowerCase() : null);

        // Tidak ada subcommand
        if (!sub) {
            return ctx.reply('❌ Please specify: `pon crt cha [name]`, `pon crt cat [name]`, `pon crt in [catID] [name]`, or `pon crt role [hex] [name]`');
        }

        // Create role
        if (sub === 'role') {
            // Cek permission ManageRoles khusus untuk role creation
            const hasRolePerms = ctx.member
                ? ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)
                : false;
            if (!hasRolePerms && !isRealAdmin && !isCustomAdmin) {
                return ctx.reply('❌ You need `Manage Roles` permission to create roles!');
            }

            const hex = isSlash ? ctx.options.getString('hex') : args[1];
            const roleName = isSlash ? ctx.options.getString('name') : args.slice(2).join(' ');

            if (!hex || !roleName) {
                return ctx.reply('❌ Format: `pon crt role #hexcolor Role Name` (Example: `pon crt role #FF0000 Admin`)');
            }

            try {
                const newRole = await guild.roles.create({ name: roleName, color: hex });
                return ctx.reply(`✅ Successfully created role: ${newRole}`);
            } catch (err) {
                return ctx.reply('❌ Failed. Ensure hex color is valid (e.g. #FF0000) and bot has `Manage Roles` permission.');
            }
        }

        // Create channel inside category
        if (sub === 'in') {
            const catId = isSlash ? ctx.options.getString('category_id') : args[1];
            const name = isSlash ? ctx.options.getString('name') : args.slice(2).join(' ');
            if (!catId || !name) return ctx.reply('❌ Format incorrect! Example: `pon crt in [CatID] channel-name`');

            const category = guild.channels.cache.get(catId);
            if (!category || category.type !== ChannelType.GuildCategory) {
                return ctx.reply('❌ Invalid Category ID!');
            }

            try {
                const newChan = await guild.channels.create({ name, type: ChannelType.GuildText, parent: category.id });
                return ctx.reply(`✅ Successfully created ${newChan} inside **${category.name}**`);
            } catch (err) {
                return ctx.reply('❌ Failed to create channel.');
            }
        }

        // Create channel or category
        const name = isSlash ? ctx.options.getString('name') : args.slice(1).join(' ');
        if (!name) return ctx.reply('❌ Please provide a name!');

        try {
            if (sub === 'cha') {
                const newChan = await guild.channels.create({ name, type: ChannelType.GuildText });
                return ctx.reply(`✅ Successfully created text channel: ${newChan}`);
            }
            if (sub === 'cat') {
                const newCat = await guild.channels.create({ name, type: ChannelType.GuildCategory });
                return ctx.reply(`✅ Successfully created category: **${newCat.name}**`);
            }
            return ctx.reply('❌ Invalid subcommand. Use `cha`, `cat`, `in`, or `role`.');
        } catch (err) {
            return ctx.reply('❌ Failed operation.');
        }
    }
};
