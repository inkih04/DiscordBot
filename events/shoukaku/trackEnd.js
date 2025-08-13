module.exports = {
    name: 'trackEnd',
    execute: async (player, track, reason, client) => {
        const queue = client.queues?.get(player.guildId);
        if (queue && queue.length > 0) {
            const nextTrack = queue.shift();
            await player.playTrack({ track: { encoded: nextTrack.encoded } });
            const textChannel = client.channels.cache.get(player.textId);
            if (textChannel) {
                textChannel.send(`🎶 Ahora reproduciendo: **${nextTrack.info.title}** por **${nextTrack.info.author}**`);
            }
        } else {
            client.queues?.delete(player.guildId);
            client.shoukaku.leaveVoiceChannel(player.guildId);
        }
    }
};
