module.exports = {
    name: 'trackStart',
    type: 'shoukaku',
    execute: (player, track, client) => {
        console.log(`🎵 Iniciando: ${track.info.title}`);
        const textChannel = client.channels.cache.get(player.textId);
        if (textChannel) {
            textChannel.send(`🎶 Ahora reproduciendo: **${track.info.title}** por **${track.info.author}**`);
        }
    }
};
