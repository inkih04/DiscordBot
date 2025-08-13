const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción desde SoundCloud o enlace directo')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('El nombre o URL de la canción')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ 
                content: 'Debes estar en un canal de voz.', 
                flags: 64
            });
        }

        const node = client.shoukaku.getIdealNode();
        
        if (!node) {
            return interaction.reply({ 
                content: '❌ No hay nodos Lavalink disponibles.', 
                flags: 64
            });
        }


        //!diferencia entre si busco palabra o link
        const identifier = query.startsWith('http') ? query : `scsearch:${query}`;
        
        let result;
        try {
            //!Consigo la musica
            result = await node.rest.resolve(identifier);
        } catch (err) {
            return interaction.reply({ 
                content: '❌ Error al buscar la canción.', 
                flags: 64
            });
        }

        if (!result || !result.data || result.data.length === 0) {
            return interaction.reply({ 
                content: '❌ No encontré resultados para tu búsqueda.', 
                flags: 64
            });
        }

        const track = result.data[0]; 

        try { //!-----------------------------------------------------------------------------------------------------------------
            let player = client.shoukaku.players.get(interaction.guildId);
            
            if (!player) {
                player = await client.shoukaku.joinVoiceChannel({
                    guildId: interaction.guildId,
                    channelId: voiceChannel.id,
                    shardId: interaction.guild.shardId
                });

                player.textId = interaction.channelId;
            }

            if (!client.queues) client.queues = new Map();
            if (!client.queues.has(interaction.guildId)) {
                client.queues.set(interaction.guildId, []);
            }

            const queue = client.queues.get(interaction.guildId);

            if (player.track) { 
                queue.push(track);
                return interaction.reply({ content: `✅ Añadido a la cola: **${track.info.title}**`, flags: 64 });
            }

            try {
                await player.playTrack({ 
                    track: { encoded: track.encoded } 
                });
                player.currentTrack = track;
            } catch (err) {
                console.error(`❌ Error al reproducir la canción: ${err.message}`);
                return interaction.reply({ 
                    content: '⚠️ No se pudo reproducir esta canción. Puede que el enlace no sea compatible.', 
                    flags: 64 
                });
            }
            //!Mensaje que se muestra en discord
            const embed = {
                color: 0x00ff00,
                title: '🎵 Reproduciendo ahora',
                description: `**${track.info.title}**`,
                fields: [
                    {
                        name: 'Autor',
                        value: track.info.author || 'Desconocido',
                        inline: true
                    },
                    {
                        name: 'Duración',
                        value: track.info.length ? 
                            `${Math.floor(track.info.length / 60000)}:${String(Math.floor((track.info.length % 60000) / 1000)).padStart(2, '0')}` : 
                            'Desconocida',
                        inline: true
                    },
                    {
                        name: 'URL',
                        value: track.info.uri ? `[Enlace](${track.info.uri})` : 'No disponible',
                        inline: true
                    }
                ],
                thumbnail: {
                    url: track.info.artworkUrl || null
                }
            };

            await interaction.reply({ embeds: [embed] });
            
        } catch (err) {
            console.error(err);
            return interaction.reply({ 
                content: '⚠️ No acepto enlaces de youtube perros',
                flags: 64
            });
        }
    }
};