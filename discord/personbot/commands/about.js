export default async function (client, interaction, options) {
	await interaction.deferReply({ ephemeral: true });
	await interaction.editReply(`**PERSONBOT** by @imaperson1060\nInvite: https://imaperson.dev/personbot`);
}