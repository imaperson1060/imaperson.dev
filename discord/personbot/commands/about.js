export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply(`**PERSONBOT** by imaperson.exe#1060\nInvite: https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2150632448&scope=bot%20applications.commands`);
}