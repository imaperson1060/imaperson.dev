import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [ "VIEW_CHANNEL", "CONNECT", "SPEAK" ];

export let data = new SlashCommandBuilder()
	.setName("ytstream")
	.setDescription("Enter a YouTube video link (not id) to stream it to an audio channel!")
	.addStringOption(option =>
		option.setName("song")
    		.setDescription("The YouTube Music URL (full, not just the id) of the song you want to stream.")
			.setRequired(true)
        )