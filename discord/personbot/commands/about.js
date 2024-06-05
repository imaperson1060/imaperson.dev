import * as components from "../components/about.js";

export default async function (client, interaction, options) {
	await interaction.reply({ embeds: [ components.aboutEmbed(client) ] });
}