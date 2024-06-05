import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

let videoEmbed = (client, video, id, more) => new EmbedBuilder()
		.setTitle(`**${video.title}** by **${video.author.display}**`)
		.setDescription(more ? video.description : "press \"view more info\" for more")
		.setURL(`https://youtu.be/${id}`)
		.setAuthor({
			name: client.user.username,
			iconURL: client.user.displayAvatarURL(),
			url: "https://imaperson.dev/personbot"
		})
		.setColor("#0099ff")
		.setImage(video.thumbnail)
		.setTimestamp()
		.setFooter({
			text: "personbot by @imaperson1060",
			icon_url: "https://avatars.githubusercontent.com/u/68653653"
		}),

	buttons = more => new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId("download")
				.setLabel("download")
				.setEmoji("⬇️")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(!more ? "more" : "less")
				.setLabel(`view ${!more ? "more" : "less"} info`)
				.setEmoji("ℹ️")
				.setStyle(ButtonStyle.Primary)
		),

	downloadButtons = (id, formats, interactionOver) => new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setLabel("mp4")
				.setURL(`https://imaperson.dev/api/yt?id=${id}&go=1`)
				.setEmoji("🎦")
				.setStyle(ButtonStyle.Link)
				.setDisabled(!formats.download),
			new ButtonBuilder()
				.setLabel("mp3")
				.setURL(`https://imaperson.dev/api/yt?id=${id}&audio=1`)
				.setEmoji("💿")
				.setStyle(ButtonStyle.Link)
				.setDisabled(!formats.audio),
			new ButtonBuilder()
				.setCustomId("back")
				.setLabel("back")
				.setEmoji("◀️")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(interactionOver)
		),

	openWebsite = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setLabel("open website")
				.setURL("https://imaperson.dev/yt")
				.setEmoji("🖥️")
				.setStyle(ButtonStyle.Link)
		);

export { videoEmbed, buttons, downloadButtons, openWebsite };