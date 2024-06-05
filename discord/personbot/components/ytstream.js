import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

let queueEmbed = description => new EmbedBuilder()
		.setTitle("queue")
		.setDescription(description),

	queueButtons = (ended, selection, queue) => new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId("prev")
				.setEmoji("937226629439176725")
				.setStyle(ButtonStyle.Primary)
				.setDisabled(ended || selection == 0),
			new ButtonBuilder()
				.setCustomId("next")
				.setEmoji("937226629581791252")
				.setStyle(ButtonStyle.Primary)
				.setDisabled(ended || selection == queue.length - 1),
			new ButtonBuilder()
				.setCustomId("remove")
				.setEmoji("937227759904780299")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(ended || selection == 0),
			new ButtonBuilder()
				.setCustomId("end")
				.setLabel("End Interaction")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(ended || false),
		);

export { queueEmbed, queueButtons };