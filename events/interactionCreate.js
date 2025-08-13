const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No se encontró el comando ${interaction.commandName}.`);
			return;
		}

		try {
			await command.execute(interaction, interaction.client);
		} catch (error) {
			console.error(error);
			const replyOptions = { content: 'Hubo un error ejecutando este comando.', flags: MessageFlags.Ephemeral };
			
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(replyOptions);
			} else {
				await interaction.reply(replyOptions);
			}
		}
	},
};
