const { SlashCommandBuilder } = require("@discordjs/builders");

exports.data = new SlashCommandBuilder()
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
			.setRequired(true)
            .addChoice("mp4", "mp4")
            .addChoice("mp3", "mp3")
        )