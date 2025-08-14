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

const nodes = [
    // Últimos servidores reportados como funcionando
    {
        name: 'Amane-AjieDev-v3-SSL-1',
        url: 'lava-v3.ajieblogs.eu.org:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Amane-AjieDev-v3-SSL-2',
        url: 'lavalinkv3-id.serenetia.com:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Amane-AjieDev-v4-SSL-1',
        url: 'lava-v4.ajieblogs.eu.org:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Amane-AjieDev-v4-SSL-2',
        url: 'lavalinkv4.serenetia.com:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Amane-AjieDev-v3-v4-SSL-1',
        url: 'lava-all.ajieblogs.eu.org:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Amane-AjieDev-v3-v4-SSL-2',
        url: 'lavalink.serenetia.com:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    }
];


// Agregar ANTES de crear Shoukaku
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    moveOnDisconnect: false,
    resumable: false,
    resumableTimeout: 30,
    reconnectTries: 3,
    restTimeout: 10000
});

// ✅ LÍNEA CRÍTICA: Asignar shoukaku al client
client.shoukaku = shoukaku;

// IMPORTANTE: Manejar errores de Shoukaku
shoukaku.on('error', (name, error) => {
    console.error(`❌ Shoukaku error on ${name}:`, error);
});

shoukaku.on('disconnect', (name, moved, reconnecting) => {
    console.log(`🔌 Node ${name} disconnected. Moved: ${moved}, Reconnecting: ${reconnecting}`);
});

shoukaku.on('reconnecting', (name) => {
    console.log(`🔄 Node ${name} reconnecting...`);
});

shoukaku.on('ready', (name) => {
    console.log(`✅ Node ${name} is ready!`);
});

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

// Verificar si la carpeta de eventos de shoukaku existe antes de intentar leerla
const shoukakuEventsPath = path.join(__dirname, 'events', 'shoukaku');
if (fs.existsSync(shoukakuEventsPath)) {
    const shoukakuEventFiles = fs.readdirSync(shoukakuEventsPath).filter(file => file.endsWith('.js'));

    for (const file of shoukakuEventFiles) {
        const filePath = path.join(shoukakuEventsPath, file);
        const event = require(filePath);
        client.shoukaku.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(token);

const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de ping escuchando en el puerto ${PORT}`);
});