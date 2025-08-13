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

const nodes = [{
    name: 'MainNode',
    url: 'localhost:2333', // Lavalink seguirá en puerto 2333
    auth: process.env.LAVALINK_SERVER_PASSWORD || process.env.PASSWORD || 'changeme'
}];

client.shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    nodes,
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


client.login(token);

const express = require('express');
const app = express();


const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de ping escuchando en el puerto ${PORT}`);
});