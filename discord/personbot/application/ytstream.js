import { PermissionsBitField } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [ PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak ];

export let data = new SlashCommandBuilder()
	.setName("ytstream")
	.setDescription("enter a youtube video link (not id) to stream it to an audio channel")
	.addSubcommand(subcommand =>
		subcommand.setName("endloop")
			.setDescription("stop the loop, if there is one (whether song or queue)")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("loop")
			.setDescription("loop the song that is now playing")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("loopqueue")
			.setDescription("loop the current queue (queue is still editable during loop)")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("play")
			.setDescription("stream a song to the voice channel you are in")
			.addStringOption(option =>
				option.setName("song")
					.setDescription("the youtube music url of the song you want to stream")
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand.setName("playlist")
			.setDescription("add all songs in a playlist to the queue")
			.addStringOption(option =>
				option.setName("playlist")
					.setDescription("the youtube playlist url of the playlist you want to add")
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand.setName("pause")
			.setDescription("pause the song currently playing")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("resume")
			.setDescription("resume a paused song")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("skip")
			.setDescription("advance to the next song in the queue")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("stop")
			.setDescription("cease. desisit. halt.")
	)
	.addSubcommand(subcommand =>
		subcommand.setName("queue")
			.setDescription("view all songs in the queue")
	);