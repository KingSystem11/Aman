const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { Poru } = require('poru');
const { Spotify } = require('poru-spotify');
const fs = require('fs');
const path = require('path');
const { setupMusicEvents } = require('./music/events');
const config = require('./config');
// ---------------------
// Per-guild prefix manager
// ---------------------
const PREFIXES_FILE = path.join(__dirname, 'prefixes.json');
let prefixes = {};

// load prefixes safely at startup
try {
  if (fs.existsSync(PREFIXES_FILE)) {
    prefixes = JSON.parse(fs.readFileSync(PREFIXES_FILE, 'utf8') || '{}');
  } else {
    prefixes = {};
    fs.writeFileSync(PREFIXES_FILE, JSON.stringify(prefixes, null, 4));
  }
} catch (err) {
  console.error('Failed to load prefixes.json:', err);
  prefixes = {};
}

function savePrefixes() {
  try {
    fs.writeFileSync(PREFIXES_FILE, JSON.stringify(prefixes, null, 4));
  } catch (err) {
    console.error('Failed to save prefixes.json:', err);
  }
}

function getGuildPrefix(guildId) {
  if (!guildId) return config.PREFIX; // fallback
  if (!prefixes[guildId]) {
    prefixes[guildId] = config.PREFIX;
    savePrefixes();
  }
  return prefixes[guildId];
}

function setGuildPrefix(guildId, newPrefix) {
  if (!guildId) return false;
  prefixes[guildId] = newPrefix;
  savePrefixes();
  return true;
}

// Export so other modules (like pCommands/setprefix.js) can require from index
module.exports.getGuildPrefix = getGuildPrefix;
module.exports.setGuildPrefix = setGuildPrefix;
module.exports.prefixes = prefixes;
module.exports.savePrefixes = savePrefixes;

const colors = {
    CYAN: '\x1b[96m',
    PURPLE: '\x1b[95m',
    PINK: '\x1b[38;5;213m',
    BLUE: '\x1b[94m',
    GREEN: '\x1b[92m',
    YELLOW: '\x1b[93m',
    RED: '\x1b[91m',
    WHITE: '\x1b[97m',
    GRAY: '\x1b[90m',
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    RESET: '\x1b[0m'
};


function printHeader() {
    console.log(`\n${colors.CYAN}╭─────────────────────────────────────────────────────────────╮${colors.RESET}`);
    console.log(`${colors.CYAN}│${colors.RESET}                     ${colors.BOLD}${colors.PURPLE}♪ GlimpZ MUSIC ♪${colors.RESET}                     ${colors.CYAN}│${colors.RESET}`);
    console.log(`${colors.CYAN}│${colors.RESET}              ${colors.DIM}${colors.WHITE}High-Quality • Fast • Reliable${colors.RESET}               ${colors.CYAN}│${colors.RESET}`);
    console.log(`${colors.CYAN}╰─────────────────────────────────────────────────────────────╯${colors.RESET}\n`);
}

function printLoading(message) {
    console.log(`${colors.BLUE}◆${colors.RESET} ${colors.DIM}Loading${colors.RESET} ${colors.WHITE}${message}${colors.RESET}${colors.DIM}...${colors.RESET}`);
}

function printSuccess(message) {
    console.log(`${colors.GREEN}✓${colors.RESET} ${colors.WHITE}${message}${colors.RESET}`);
}

function printError(message) {
    console.log(`${colors.RED}✗${colors.RESET} ${colors.BOLD}Error:${colors.RESET} ${message}`);
}

function printInfo(message) {
    console.log(`${colors.PURPLE}ⓘ${colors.RESET} ${colors.WHITE}${message}${colors.RESET}`);
}

function printSeparator() {
    const separator = `${colors.CYAN}─${colors.PURPLE}─${colors.BLUE}─${colors.RESET}`;
    console.log(`   ${separator.repeat(20)}`);
}

function printSystemReady() {
    printSeparator();
    console.log(`\n   ${colors.BOLD}${colors.PURPLE}♪ System Operational ♪${colors.RESET}`);
    console.log(`   ${colors.DIM}${colors.WHITE}Developed with ${colors.PINK}♡${colors.WHITE} by KingSystem11${colors.RESET}`);
    console.log(`   ${colors.DIM}${colors.GRAY}Ready to bring music to your servers${colors.RESET}\n`);
    printSeparator();
    console.log();
}


printHeader();


global.aerox = {
    bot: {
        color: '#5865F2'
    },
    addons: {
        music: {
            spotify: {
                clientID: config.SPOTIFY.CLIENT_ID,
                clientSecret: config.SPOTIFY.CLIENT_SECRET
            },
            playlistLimit: config.MUSIC.PLAYLIST_LIMIT || 3,
            useAI: false
        },
        ai: {
            geminiApiKeys: null
        }
    },
    db: {
        timezone: '+00:00'
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.prefixCommands = new Collection();


printLoading('Command modules');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

let loadedCommands = 0;
let skippedCommands = 0;

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        loadedCommands++;
    } else {
        skippedCommands++;
    }
}

printSuccess(`Command modules loaded (${loadedCommands} commands)`);
if (skippedCommands > 0) {
    printInfo(`Skipped ${skippedCommands} invalid command files`);
}


printLoading('Prefix command modules');
const pCommandsPath = path.join(__dirname, 'pCommands');
const pCommandFiles = fs.readdirSync(pCommandsPath).filter(file => file.endsWith('.js'));

let loadedPrefixCommands = 0;
let skippedPrefixCommands = 0;

for (const file of pCommandFiles) {
    const filePath = path.join(pCommandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.prefixCommands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
                client.prefixCommands.set(alias, command);
            });
        }
        loadedPrefixCommands++;
    } else {
        skippedPrefixCommands++;
    }
}

printSuccess(`Prefix command modules loaded (${loadedPrefixCommands} commands)`);
if (skippedPrefixCommands > 0) {
    printInfo(`Skipped ${skippedPrefixCommands} invalid prefix command files`);
}


printLoading('Event handlers');
const eventsPath = path.join(__dirname, 'events');
let loadedEvents = 0;

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if ('name' in event && 'execute' in event) {
            client.on(event.name, (...args) => event.execute(...args, client));
            loadedEvents++;
        }
    }
    printSuccess(`Event handlers loaded (${loadedEvents} events)`);
} else {
    printInfo('No events directory found, skipping event loading');
}


printLoading('Database connection');
require('../database/models');
printSuccess('Database initialized');


const nodes = [];
const hosts = config.LAVALINK.HOSTS.split(',');
const ports = config.LAVALINK.PORTS.split(',');
const passwords = config.LAVALINK.PASSWORDS.split(',');
const secures = config.LAVALINK.SECURES.split(',');

for (let i = 0; i < hosts.length; i++) {
    nodes.push({
        name: `Node-${i + 1}`,
        host: hosts[i].trim(),
        port: parseInt(ports[i].trim()),
        password: passwords[i].trim(),
        secure: secures[i].trim() === 'true'
    });
}

printLoading('Music system (LavaLink)');


let lavaLinkConnected;
const lavaLinkPromise = new Promise((resolve) => {
    lavaLinkConnected = resolve;
});

client.poru = new Poru(client, nodes, {
    library: 'discord.js',
    defaultPlatform: config.MUSIC.DEFAULT_PLATFORM,
    resumeKey: 'AeroXMusicBot',
    resumeTimeout: 60,
    reconnectTimeout: 10000,
    reconnectTries: 5,
    plugins: config.SPOTIFY.CLIENT_ID && config.SPOTIFY.CLIENT_SECRET ? [
        new Spotify({
            clientID: config.SPOTIFY.CLIENT_ID,
            clientSecret: config.SPOTIFY.CLIENT_SECRET,
        })
    ] : []
});

client.poru.on('nodeConnect', (node) => {
    if (lavaLinkConnected) {
        lavaLinkConnected(node);
        lavaLinkConnected = null; 
    }
});

client.poru.on('nodeReconnect', (node) => {
    printInfo(`LavaLink node reconnecting: ${node.name}`);
});

client.poru.on('nodeDisconnect', (node) => {
    printError(`LavaLink node disconnected: ${node.name}`);
});

client.poru.on('nodeError', (node, error) => {
    printError(`LavaLink node error (${node.name}): ${error.message}`);
});


client.poru.on('playerCreate', (player) => {
    
});

client.poru.on('playerDestroy', (player) => {
    
});

client.once('clientReady', async () => {
    printSuccess(`Authentication successful → ${colors.PURPLE}${client.user.tag}${colors.RESET}`);
    
    printLoading('Music player system');
    client.poru.init(client.user.id);
    setupMusicEvents(client);
    printSuccess('Music player system initialized');

    printLoading('LavaLink connection');
    try {
        
        const node = await Promise.race([
            lavaLinkPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 10000)
            )
        ]);
        printSuccess(`LavaLink node connected: ${node.name}`);
    } catch (error) {
        printError(`LavaLink connection failed: ${error.message}`);
    }

    printLoading('Synchronizing slash commands');
    try {
        await registerCommands();
        printSuccess(`Command synchronization complete (${client.commands.size} commands)`);
    } catch (error) {
        printError(`Failed to register commands: ${error.message}`);
    }

    printInfo(`Connected to ${client.guilds.cache.size} guilds`);
    printSystemReady(); 
    // 🎬 Activity Rotation System — GlimpZ

    const statuses = [

        { name: " Nexo| .help  ", type: 2, url: "https://twitch.tv/kingbot" },

        { name: "Helping 45000+ User ", type: 2, url: "https://twitch.tv/kingbot" },

        { name: " Powered by Nexo System", type: 2, url: "https://twitch.tv/kingbot" },

        { name: " Bringing Beats to Your Server", type: 2, url: "https://twitch.tv/kingbot" },

        { name: " Feel the Music Flow", type: 2, url: "https://twitch.tv/kingbot" }

    ];

    let _statusIndex = 0;

    // Update every 5 seconds (5000 ms)

    setInterval(() => {

        const activity = statuses[_statusIndex];

        client.user.setPresence({

            activities: [activity],

            status: "online"

        });

        // Loop back to first after the last

        _statusIndex = (_statusIndex + 1) % statuses.length;

    }, 10000);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);

            const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply(errorMessage);
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply(errorMessage);
                }
            } catch (replyError) {
                console.error('Error sending error response:', replyError);
            }
        }
    } else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(`Autocomplete error for ${interaction.commandName}:`, error);
        }
    }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    // ✅ NoPrefix system check
    const NoPrefix = require('../database/models/NoPrefix');
    const hasNoPrefix = await NoPrefix.isNoPrefixUser(message.author.id);

    // ✅ Load the most up-to-date prefix (always from file)
    delete require.cache[require.resolve('./prefixes.json')]; // Clear cache
    const freshPrefixes = require('./prefixes.json');
    prefixes = freshPrefixes; // Refresh global object

    let guildPrefix = prefixes[message.guild.id] || config.PREFIX;
    if (!guildPrefix || typeof guildPrefix !== "string") guildPrefix = config.PREFIX;

    // ✅ Ensure JSON file is always up to date
    if (!prefixes[message.guild.id]) {
      prefixes[message.guild.id] = guildPrefix;
      savePrefixes();
    }

    // ✅ Clean message text
    const content = message.content.trim();

    // ✅ Handle three cases
    let prefixUsed = null;

    // CASE 1 — NoPrefix user (ignore prefix)
    if (hasNoPrefix && !content.startsWith(guildPrefix)) {
      prefixUsed = ""; // No prefix needed
    }

    // CASE 2 — Server or default prefix
    else if (content.startsWith(guildPrefix)) {
      prefixUsed = guildPrefix;
    }

    // CASE 3 — Mention prefix (optional, if you want to use @bot)
    else {
      const mention1 = `<@${client.user.id}>`;
      const mention2 = `<@!${client.user.id}>`;
      if (content.startsWith(mention1) || content.startsWith(mention2)) {
        prefixUsed = content.startsWith(mention1) ? mention1 : mention2;
        // if message is ONLY mention, skip (container handles it)
        if (content === prefixUsed) return;
      }
    }

    // ❌ If no prefix type matched, ignore
    if (prefixUsed === null) return;

    // ✅ Extract args and command name
    const withoutPrefix = content.slice(prefixUsed.length).trim();
    if (!withoutPrefix) return;

    const args = withoutPrefix.split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    // ✅ Find comman

 const command = client.prefixCommands.get(commandName);
if (!command) return;

// Premium-Tier Verification
if (command.tierRequired) {
  const { getUserPremium } = require('./utils/premiumManager');
  const userPremium = getUserPremium(message.author.id);

  const tierLevels = ['bronze', 'silver', 'gold', 'platinum'];

  // User doesn't have any premium
  if (!userPremium) {
    return message.reply('This command requires ' + command.tierRequired.toUpperCase() + ' tier or higher.');
  }

  const userTierIndex = tierLevels.indexOf(userPremium.tier.toLowerCase());
  const requiredTierIndex = tierLevels.indexOf(command.tierRequired.toLowerCase());

  // User has lower tier
  if (userTierIndex < requiredTierIndex) {
    return message.reply('You need **' + command.tierRequired.toUpperCase() + '** or higher to use this command.');
  }

  // Check if this server is premium-activated
  if (!userPremium.servers || !userPremium.servers.includes(message.guild.id)) {
    return message.reply('This server does not have premium activated.');
  }
}

// ✅ If everything ok, execute command
await command.execute(message, args);
      
  } catch (err) {
    console.error('❌ Prefix Handler Error:', err);
    try { await message.reply('⚠️ Error executing this command.'); } catch {}
  }
});

async function registerCommands() {
    const commands = [];

    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);

    await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
    );
}

client.on('error', (error) => {
    printError(`Discord client error: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
    printError(`Unhandled rejection: ${error.message}`);
});

process.on('uncaughtException', (error) => {
    printError(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log(`\n${colors.YELLOW}⚠${colors.RESET}  Received SIGINT, shutting down gracefully...`);
    client.destroy();
    process.exit(0);
});

printLoading('Discord authentication');
client.login(config.BOT_TOKEN).catch((error) => {
    printError(`Failed to login: ${error.message}`);
    process.exit(1);
});
if (process.env.NODE_ENV === "development") {

  const chokidar = require('chokidar');

  const { reloadPrefixCommands } = require('./utils/reloader');

  const path = require('path');

  const watchPath = path.join(__dirname, 'pCommands');

  chokidar.watch(watchPath).on('change', (file) => {

    console.log(`[🔁] File updated: ${file}`);

    reloadPrefixCommands(client, watchPath);

  });

}
/*
: ! Aegis !
    + Discord: KingSystem11@
    + Community: https://discord.gg/DHfZAycmC  (KingSystem11 Development ) 
*/
