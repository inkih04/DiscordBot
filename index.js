require('dotenv').config()



/ Protección contra event loop blocking
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // NO terminar el proceso, solo loggear
});

process.on('uncaughtException', (error) => {
    console.error('💀 Uncaught Exception:', error);
    // Intentar recovery graceful
    setTimeout(() => {
        console.log('🔄 Intentando recovery después de uncaught exception...');
    }, 1000);
});

// Monitor del event loop cada 30 segundos
let lastEventLoop = process.hrtime();
setInterval(() => {
    const currentTime = process.hrtime();
    const elapsed = (currentTime[0] - lastEventLoop[0]) * 1000 + (currentTime[1] - lastEventLoop[1]) / 1000000;
    
    if (elapsed > 35000) { // Si tardó más de 35s (debería ser ~30s)
        console.warn(`⚠️ Event loop lag detectado: ${Math.round(elapsed)}ms`);
    }
    
    lastEventLoop = currentTime;
    console.log(`💓 Heartbeat: ${new Date().toISOString()} | Discord: ${client.isReady() ? '✅' : '❌'}`);
}, 30000);

// Timeout de seguridad para comandos
const originalClientLogin = client.login;
client.login = function(token) {
    console.log('🚀 Iniciando login a Discord...');
    const loginTimeout = setTimeout(() => {
        console.error('⏱️ Login timeout después de 30s');
    }, 30000);
    
    return originalClientLogin.call(this, token).then(result => {
        clearTimeout(loginTimeout);
        console.log('✅ Login completado exitosamente');
        return result;
    }).catch(error => {
        clearTimeout(loginTimeout);
        console.error('❌ Error en login:', error);
        throw error;
    });
};




// 🐛 DEBUG: Verificar variables de entorno
console.log('🔍 Variables de entorno cargadas:');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? `✅ Presente (${process.env.DISCORD_TOKEN.length} chars)` : '❌ Falta');
console.log('CLIENT_ID:', process.env.CLIENT_ID ? '✅ Presente' : '❌ Falta');
console.log('HOST:', process.env.HOST || 'undefined');

const token = process.env.DISCORD_TOKEN;

// 🚨 Verificar que el token existe y tiene formato correcto
if (!token) {
    console.error('❌ ERROR: DISCORD_TOKEN no está definido');
    console.error('Variables disponibles:', Object.keys(process.env).filter(key => key.includes('DISCORD')));
    process.exit(1);
}

// Verificar formato básico del token
if (!token.includes('.') || token.length < 50) {
    console.error('❌ ERROR: El token parece malformado');
    console.error('Longitud del token:', token.length);
    console.error('Primeros 10 chars:', token.substring(0, 10));
    console.error('Últimos 10 chars:', token.substring(token.length - 10));
    process.exit(1);
}

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
    moveOnDisconnect: false,       // No mover automáticamente para evitar loops
    resumable: false,              // Desactivar resumable por ahora
    resumableTimeout: 30,
    reconnectTries: 2,             // REDUCIR intentos (era 3)
    reconnectInterval: 15000,      // AUMENTAR intervalo entre intentos (15s)
    restTimeout: 10000
});

// Manejo de errores más agresivo para prevenir loops
shoukaku.on('error', (name, error) => {
    console.error(`❌ Shoukaku error on ${name}:`, error.message);
    
    // Si un nodo da muchos errores 403, deshabilitarlo temporalmente
    const node = shoukaku.nodes.get(name);
    if (error.message.includes('403') && node) {
        console.log(`🚫 Deshabilitando temporalmente el nodo ${name} por errores 403`);
        // No intentar reconectar nodos con 403
        return;
    }
});

shoukaku.on('disconnect', (name, moved, reconnecting) => {
    console.log(`🔌 Node ${name} disconnected. Moved: ${moved}, Reconnecting: ${reconnecting}`);
    
    // Limitar reconexiones problemáticas
    const node = shoukaku.nodes.get(name);
    if (node && node.reconnectAttempts > 3) {
        console.log(`🛑 Nodo ${name} superó el límite de reconexiones, deteniéndolo`);
    }
});

shoukaku.on('reconnecting', (name) => {
    console.log(`🔄 Node ${name} reconnecting...`);
});

shoukaku.on('ready', (name) => {
    console.log(`✅ Node ${name} is ready!`);
});

client.shoukaku = shoukaku;


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

// 🐛 DEBUG: Intentar login
console.log('🚀 Intentando conectar a Discord...');
client.login(token).catch(error => {
    console.error('❌ Error al hacer login:', error);
});

const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de ping escuchando en el puerto ${PORT}`);
});