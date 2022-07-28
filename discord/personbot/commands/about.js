export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply(`**PERSONBOT** by imaperson.exe#1060\nInvite: https://imaperson.dev/personbot`);
}