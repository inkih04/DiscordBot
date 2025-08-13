require('dotenv').config()

const token = process.env.DISCORD_TOKEN;
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');

const urlHost = process.env.HOST;
const lpassword = process.env.PASSWORD;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ] 
});

client.commands = new Collection();

client.queues = new Map();

const Nodes = [
    {
        name: 'MainNode',
        url: `${urlHost}:2333`,
        auth: lpassword,
        secure: false
    }
];

client.shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    Nodes,
    {
        reconnectTries: 3,
        reconnectInterval: 5000,

        nodeResolver: (nodes, connection) => {
            const availableNodes = [...nodes.values()].filter(node => node.state === 2); // CONNECTED = 2
            return availableNodes[0];
        }
    }
);

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] El comando en ${filePath} no tiene las propiedades "data" o "execute" requeridas.`);
        }
    }
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

const shoukakuEventsPath = path.join(__dirname, 'events', 'shoukaku');
const shoukakuEventFiles = fs.readdirSync(shoukakuEventsPath).filter(file => file.endsWith('.js'));

for (const file of shoukakuEventFiles) {
    const filePath = path.join(shoukakuEventsPath, file);
    const event = require(filePath);
    client.shoukaku.on(event.name, (...args) => event.execute(...args, client));
}

const fetch = require('node-fetch'); 

const LAVALINK_PING_URL = 'https://tu-lavalink-en-render.com/version';

setInterval(async () => {
    try {
        const res = await fetch(LAVALINK_PING_URL);
        if (res.ok) {
            console.log(`🔄 Lavalink ping ok - ${new Date().toLocaleTimeString()}`);
        } else {
            console.log(`⚠️ Lavalink ping fallo (${res.status})`);
        }
    } catch (err) {
        console.log(`❌ Error al hacer ping a Lavalink:`, err.message);
    }
}, 10 * 60 * 1000);


client.login(token);