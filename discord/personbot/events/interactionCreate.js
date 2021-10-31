export default function (client, interaction) {
    if (!interaction.isCommand()) return;
  
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
  
    cmd.run(client, interaction, interaction.options._hoistedOptions);
}