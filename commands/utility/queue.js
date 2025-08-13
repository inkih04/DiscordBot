const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra las canciones en la cola (máx 5 próximas)'),

    async execute(interaction, client) {
        const player = client.shoukaku.players.get(interaction.guildId);

        if (!player) {
            return interaction.reply({ 
                content: '❌ No hay ninguna canción reproduciéndose.',
                flags: 64
            });
        }

        if (!client.queues || !client.queues.has(interaction.guildId)) {
            return interaction.reply({ 
                content: '❌ La cola está vacía.',
                flags: 64
            });
        }

        const queue = client.queues.get(interaction.guildId);

        // Guardamos el track actual desde el player
        const currentTrack = player.currentTrack || player.trackData || player.track || null;

        if (!currentTrack || !currentTrack.info) {
            return interaction.reply({
                content: '❌ No hay información del track actual.',
                flags: 64
            });
        }

        let description = `🎶 **Ahora suena:**\n` +
            `**${currentTrack.info.title}** - ${currentTrack.info.author || 'Desconocido'}\n` +
            `${currentTrack.info.uri ? `[Enlace](${currentTrack.info.uri})` : 'No disponible'}\n\n`;

        if (queue.length > 0) {
            description += `📜 **Próximas canciones:**\n`;
            queue.slice(0, 5).forEach((track, i) => {
                description += `**${i + 1}.** ${track.info.title} - ${track.info.author || 'Desconocido'} (${track.info.length ? 
                    `${Math.floor(track.info.length / 60000)}:${String(Math.floor((track.info.length % 60000) / 1000)).padStart(2, '0')}` : 
                    'Desconocida'})\n`;
            });
        } else {
            description += `📜 No hay más canciones en la cola.`;
        }

        const embed = {
            color: 0x00ff00,
            title: '🎵 Cola de reproducción',
            description,
            thumbnail: {
                url: currentTrack.info.artworkUrl || null
            }
        };

        return interaction.reply({ embeds: [embed] });
    }
};
