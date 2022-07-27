import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("ytdownload")
	.setDescription("Enter a YouTube video link (not id) for it to be converted to an mp4!")
	.addStringOption(option =>
    	option.setName("video")
	      	.setDescription("The ID of the video you want to download.")
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName("cookie")
			.setDescription("Your YouTube cookie (for private/age restricted videos)")
			.setRequired(false)
	)