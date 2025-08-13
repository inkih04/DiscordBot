const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta la canción actual y reproduce la siguiente en la cola'),

    async execute(interaction, client) {
        const player = client.shoukaku.players.get(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ content: '❌ No hay nada reproduciéndose.', flags: 64 });
        }

        const queue = client.queues.get(interaction.guildId) || [];

        const nextTrack = queue.shift();

        if (nextTrack) {
            await player.playTrack({ track: { encoded: nextTrack.encoded } });
            await interaction.reply(`⏭️ Saltado. Ahora suena: **${nextTrack.info.title}**`);
        } else {
            await player.stopTrack();
            await interaction.reply('⏹️ No hay más canciones en la cola. Reproducción detenida.');
        }

        client.queues.set(interaction.guildId, queue);
    }
};
