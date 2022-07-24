export default function (client, interaction) {
    if (!interaction.isChatInputCommand()) return;
  
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
  
    cmd.default(client, interaction, interaction.options._hoistedOptions);
}