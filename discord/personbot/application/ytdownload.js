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
    option.setName("format")
      .setDescription("The type of file you want returned.")
      .addChoices(
        { name: "mp4", value: "mp4" },
        { name: "mp3", value: "mp3" }
      )
			.setRequired(true)
  )