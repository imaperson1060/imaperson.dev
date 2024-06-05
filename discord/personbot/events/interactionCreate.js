export default function (client, interaction) {
	if (!interaction.isChatInputCommand()) return;
	client.commands.get(interaction.commandName)?.default(client, interaction, interaction.options._hoistedOptions);
}