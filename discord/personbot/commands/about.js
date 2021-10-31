export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply(`**PERSONBOT** by imaperson#1060\nInvite: https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands`);
}