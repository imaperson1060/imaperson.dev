import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [ "VIEW_CHANNEL", "CONNECT", "SPEAK" ];

export let data = new SlashCommandBuilder()
	.setName("ytstream")
	.setDescription("Enter a YouTube video link (not id) to stream it to an audio channel!")
	.addSubcommand(subcommand =>
		subcommand.setName("play")
			.setDescription("Stream a song to the voice channel you are in")
			.addStringOption(option =>
				option.setName("song")
					.setDescription("The YouTube Music URL (full, not just the id) of the song you want to stream.")
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand.setName("skip")
			.setDescription("Advance to the next song in the queue")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("stop")
			.setDescription("Cease. Desisit. Halt.")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("queue")
			.setDescription("View all songs in the queue")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("volume")
			.setDescription("View or change the volume in your current voice channel")
			.addNumberOption(option =>
				option.setName("new")
					.setDescription("The new volume")
					.setMinValue(1)
					.setMaxValue(10)
					.addChoice("1", 1)
					.addChoice("2", 2)
					.addChoice("3", 3)
					.addChoice("4", 4)
					.addChoice("5", 5)
					.addChoice("6", 6)
					.addChoice("7", 7)
					.addChoice("8", 8)
					.addChoice("9", 9)
					.addChoice("10", 10)
					.setRequired(true)
			)
	)