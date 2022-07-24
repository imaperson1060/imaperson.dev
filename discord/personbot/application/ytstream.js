import { PermissionsBitField } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [ PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak ];

export let data = new SlashCommandBuilder()
	.setName("ytstream")
	.setDescription("Enter a YouTube video link (not id) to stream it to an audio channel!")
	.addSubcommand(subcommand =>
    subcommand.setName("alias")
			.setDescription("Link a song to an alias you can use in its place for easy access")
			.addStringOption(option =>
				option.setName("song")
					.setDescription("The YouTube Music URL (full, not just the id) of the song you want to make an alias for.")
					.setRequired(true)
			)
			.addStringOption(option =>
				option.setName("alias")
					.setDescription("The alias to reference the song with (unchangable at the moment)")
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand.setName("endloop")
			.setDescription("Stop the loop, if there is one (whether song or queue)")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("loop")
			.setDescription("Loop the song that is now playing")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("loopqueue")
			.setDescription("Loop the current queue (queue is still editable during loop)")
	)
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
		subcommand.setName("pause")
			.setDescription("Pause the song currently playing")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("resume")
			.setDescription("Resume a paused song")
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
					.addChoices(
            { name: "1", value: 1 },
            { name: "2", value: 2 },
            { name: "3", value: 3 },
            { name: "4", value: 4 },
            { name: "5", value: 5 },
            { name: "6", value: 6 },
            { name: "7", value: 7 },
            { name: "8", value: 8 },
            { name: "9", value: 9 },
            { name: "10", value: 10 }
					)
					.setRequired(true)
			)
	)