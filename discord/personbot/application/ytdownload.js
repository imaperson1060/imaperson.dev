import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("ytdownload")
	.setDescription("enter a youtube video link for it to be converted to an mp4")
	.addStringOption(option =>
		option.setName("video")
			.setDescription("the url of the video you want to download")
			.setRequired(true)
	);