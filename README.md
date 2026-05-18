# 🏕️ Pioneer Outpost Nusa — Support Bot

Bot Discord multifungsi untuk server **Pioneer Outpost Nusa**. Mendukung sistem moderation, ticket, welcome greeting, suggestion, dan fun commands.

## Features

| Kategori               | Fitur                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Moderation**         | AutoMod (word filter, link filter, caps filter), warn system dengan auto-mute, lock/unlock channel, slowmode, bulk delete messages |
| **Channel Management** | Create/delete text channel, category, role                                                                                         |
| **Ticket System**      | Panel dropdown → private channel → transcript log saat close                                                                       |
| **Welcome**            | Custom GIF greeting saat member join, rotasi teks random                                                                           |
| **Suggestion**         | Panel button → modal input → voting embed (⬆️/⬇️)                                                                                  |
| **Admin Access**       | Custom bot admin system (grant/revoke tanpa perlu Discord permission)                                                              |
| **Fun**                | Random cat, dog, meme dari API eksternal                                                                                           |
| **AFK**                | Set AFK status, notifikasi otomatis saat di-mention                                                                                |

## Tech Stack

- **Runtime:** Node.js
- **Library:** [discord.js](https://discord.js.org/) v14
- **Database:** JSON file (`serverSettings.json`, `afk.json`)
- **Command System:** Dual-mode (prefix `pon` + slash commands)

## Project Structure

```
├── index.js                  # Entry point, bootstrap client
├── config.js                 # Konstanta (prefix, file paths)
├── deploy-commands.js        # Register slash commands ke Discord API
├── handlers/
│   ├── commandHandler.js     # Auto-load commands dari folder
│   └── eventHandler.js       # Auto-load event listeners
├── events/
│   ├── clientReady.js        # Bot online handler
│   ├── guildMemberAdd.js     # Welcome greeting
│   ├── interactionCreate.js  # Slash command & interaction router
│   └── messageCreate.js      # Prefix command & automod
├── commands/
│   ├── admin/                # access, warn, word (filter)
│   ├── fun/                  # cat, dog, meme
│   ├── general/              # afk, help, info
│   ├── moderation/           # crt, rmv, lock, unlock, slowmode
│   └── setup/                # set, suggestion, ticket, wcm
├── interactions/
│   ├── ticketMenu.js         # Dropdown ticket handler
│   ├── closeTicket.js        # Close & transcript ticket
│   ├── helpMenu.js           # Help dropdown navigation
│   ├── suggestionButton.js   # Open suggestion modal
│   └── suggestionModal.js    # Process & post suggestion
├── utils/
│   ├── database.js           # Settings persistence (atomic write)
│   └── welcome.js            # Welcome message logic
└── emojis.json               # Custom emoji mapping untuk help panel
```

## Setup

### Prerequisites

- Node.js v18+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
git clone https://github.com/MassPepengS/pon-support-bot.git
cd pon-support-bot
npm install
```

### Configuration

Copy `.env.example` ke `.env` dan isi:

```env
TOKEN=your_bot_token_here
CLIENT_ID=your_bot_application_id
GUILD_ID=your_server_id
```

### Register Slash Commands

```bash
node deploy-commands.js
```

### Run

```bash
node index.js
```

Development mode (auto-restart on file change):

```bash
npm run dev
```

## Commands

### Prefix Commands (`pon <command>`)

| Command                              | Deskripsi                            | Permission   |
| ------------------------------------ | ------------------------------------ | ------------ |
| `pon afk [reason]`                   | Set status AFK                       | Semua        |
| `pon info`                           | Statistik bot                        | Semua        |
| `pon cat` / `dog` / `meme`           | Random gambar lucu                   | Semua        |
| `pon help`                           | Panel help interaktif                | Semua        |
| `pon crt cha/cat/role [...]`         | Buat channel/category/role           | Admin        |
| `pon rmv cha/cat/role/msg [...]`     | Hapus channel/category/role/messages | Admin        |
| `pon lock [#channel]`                | Kunci channel                        | Admin        |
| `pon unlock [#channel]`              | Buka kunci channel                   | Admin        |
| `pon slowmode [#channel] [seconds]`  | Set slowmode                         | Admin        |
| `pon set wcm/log/sug/mod [#channel]` | Setup channel target                 | Admin        |
| `pon wcm gif/list/rmv [...]`         | Manage welcome GIF                   | Admin        |
| `pon warn @user [reason]`            | Warn user (3x = auto-mute 3 hari)    | Admin        |
| `pon word add/rmv/list [...]`        | Manage word filter                   | Admin        |
| `pon access add/rmv/list [@user]`    | Manage custom bot admins             | Server Admin |
| `pon ticket`                         | Deploy ticket panel                  | Admin        |
| `pon suggestion`                     | Deploy suggestion panel              | Admin        |

### Slash Commands

Semua command di atas juga tersedia sebagai slash command (`/afk`, `/help`, `/warn`, dll).

## AutoMod

Bot otomatis mendeteksi dan menghapus:

1. **Kata terlarang** — dikelola via `pon word add/rmv`
2. **Link** — semua URL (kecuali member punya permission Manage Messages)
3. **Caps Lock berlebihan** — >70% huruf kapital pada pesan >15 karakter

Setiap pelanggaran dicatat di channel moderation log dengan case ID unik.

## License

ISC
