module.exports = {
    name: 'voiceStateUpdate',
    execute: (oldState, newState, client) => {
        // Si el bot (client.user.id) ha salido del canal de voz
        if (oldState.member?.id === client.user.id && !newState.channelId) {
            const player = client.shoukaku.players.get(oldState.guild.id);
            if (player) {
                client.shoukaku.leaveVoiceChannel(oldState.guild.id);
                console.log(`🛑 Se ha desconectado del canal de voz en ${oldState.guild.name}`);
            }
        }
    }
};
