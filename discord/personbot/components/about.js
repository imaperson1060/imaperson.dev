import { EmbedBuilder } from "discord.js";

let aboutEmbed = client => new EmbedBuilder()
	.setTitle("**PERSONBOT**")
	.setDescription(`by @imaperson1060`)
	.setAuthor({
		name: client.user.username,
		iconURL: client.user.displayAvatarURL(),
		url: "https://imaperson.dev/personbot"
	})
	.setColor("#0099ff")
	.setTimestamp();

export { aboutEmbed };