const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la reproducción y desconecta el bot'),
    async execute(interaction, client) {

        if (!interaction.member.voice.channel) {
            return interaction.reply('❌ Debes estar en un canal de voz para usar este comando.');
        }

        const player = client.shoukaku.players.get(interaction.guild.id);
        
        if (!player) {
            return interaction.reply('❌ No hay música sonando.');
        }

        client.queues?.delete(player.guildId);
        player.stopTrack();

        
        client.shoukaku.leaveVoiceChannel(interaction.guild.id);
        
        interaction.reply('🛑 Música detenida y bot desconectado.');
    }
};