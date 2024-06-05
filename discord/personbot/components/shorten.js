import { EmbedBuilder } from "discord.js";
import moment from "moment";

let shortURLEmbed = (client, domain, id, editkey, expiration) => new EmbedBuilder()
	.setTitle(`**success!**`)
	.setDescription(`your url was shortened successfully`)
	.setAuthor({
		name: client.user.username,
		iconURL: client.user.displayAvatarURL(),
		url: "https://imaperson.dev/personbot"
	})
	.setColor("#0099ff")
	.addFields(
		{ name: "url", value: `[imaurl.${domain}/${id}](https://imaurl.${domain}/${id})`, inline: true },
		{ name: "edit key", value: editkey, inline: true },
		{ name: "expiration", value: moment().to(moment.unix(expiration)), inline: true }
	)
	.setTimestamp()
	.setFooter({
		text: "personbot by @imaperson1060",
		icon_url: "https://avatars.githubusercontent.com/u/68653653"
	});

export { shortURLEmbed };