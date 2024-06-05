import discordaudio from "discordaudio";
import { ComponentType } from "discord.js";
import mysql from "mysql";
import util from "util";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";

import * as components from "../components/ytstream.js";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "yt" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

let yt = { dl: ytdl, pl: ytpl, sr: ytsr };

async function getVideoDetails(id, cookie) {
	let video = (await query("SELECT * FROM `videos` WHERE id=?", [ id ]))[0];
	if (video && video.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) return { code: 200, id, title: JSON.parse(decodeURIComponent(video.title)), description: JSON.parse(decodeURIComponent(video.description)), author: JSON.parse(decodeURIComponent(video.author)), formats: JSON.parse(decodeURIComponent(video.formats)) };

	let videoInfo;
	try { videoInfo = await yt.dl.getInfo(id, { requestOptions: { headers: { cookie: cookie ?? null } } }); }
	catch (e) {
		if (e.toString().indexOf("private video") != -1) return { code: cookie ? 403 : 401, error: cookie ? "invalid cookie" : "this video is private" };
		else if (e.toString().indexOf("video id found") != -1 || e.toString().indexOf("unavailable") != -1) return { code: 404, error: "video not found" };
		else return { code: 500, error: "an unknown error occurred" };
	}

	let formats = { download: videoInfo.formats.filter(video => video.hasVideo && video.hasAudio).sort((a, b) => b.height * b.width - a.height * a.width)[0].url, video: videoInfo.formats.filter(video => video.hasVideo && !video.hasAudio).sort((a, b) => b.height * b.width - a.height * a.width)[0].url, audio: videoInfo.formats.filter(x => !x.hasVideo && x.hasAudio).sort((a, b) => b.audioBitrate - a.audioBitrate)[0].url };
	if (videoInfo.videoDetails.isPrivate);
	else if ((await query("SELECT * FROM `videos` WHERE id=?", [id]))[0]) await query("UPDATE `videos` SET `title`=?, `description`=?, `author`=?, `formats`=?, `timestamp`=? WHERE `id`=?", [ encodeURIComponent(JSON.stringify(videoInfo.videoDetails.title)), encodeURIComponent(JSON.stringify(videoInfo.videoDetails.description)), encodeURIComponent(JSON.stringify({ display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user })), encodeURIComponent(JSON.stringify(formats)), Math.round(new Date().getTime() / 1000), id ]);
	else await query("INSERT INTO `videos`(`id`, `title`, `description`, `author`, `formats`, `timestamp`) VALUES (?,?,?,?,?,?)", [ id, encodeURIComponent(JSON.stringify(videoInfo.videoDetails.title)), encodeURIComponent(JSON.stringify(videoInfo.videoDetails.description)), encodeURIComponent(JSON.stringify({ display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user })), encodeURIComponent(JSON.stringify(formats)), Math.round(new Date().getTime() / 1000) ]);

	return { code: 200, id, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, author: { display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user }, formats };
}

let connections = new Map();
export default async function (client, interaction, options) {
	await interaction.deferReply({ ephemeral: true });

	let vc = interaction.member.voice.channel;
	if (!vc) return await interaction.editReply("you are not in a voice channel");

	let audioManager = connections.get(vc);
	switch (interaction.options._subcommand) {
		case "endloop":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			audioManager.loop(vc, audioManager.looptypes.off);
			await interaction.editReply("stopped loop");
			break;
		case "loop":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			audioManager.loop(vc, audioManager.looptypes.loop);
			await interaction.editReply(`looping "${(await audioManager.queue(vc))[0].title}"`);
			break;
		case "loopqueue":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			audioManager.loop(vc, audioManager.looptypes.off);
			await interaction.editReply("looping queue");
			break;
		case "play":
			let songID = options.find(x => x.name == "song").value;
			try { songID = yt.dl.getURLVideoID(songID); }
			catch (e) { return await interaction.editReply("no song id found in url"); }
			let song = await getVideoDetails(songID);

			audioManager = audioManager || new discordaudio.AudioManager();
			if (connections.get(vc) && audioManager.queue(vc).find(x => x.url == options.find(x => x.name == "song").value)) return await interaction.editReply("the song submitted is already in the queue or is playing");

			let manager = await audioManager.play(vc, options.find(x => x.name == "song").value, { autoleave: true, quality: "high" });
			connections.set(vc, audioManager);
			audioManager.on("end", vc => connections.delete(vc));
			if (!manager) await interaction.editReply(`playing "${song.title}" in :loud_sound: ${client.channels.cache.get(vc.id).name}`);
			else await interaction.editReply(`added "${song.title}" to queue`);

			break;
		case "playlist":
			let playlistID = options.find(x => x.name == "playlist").value;
			try { playlistID = await yt.pl.getPlaylistID(playlistID); }
			catch (e) { return await interaction.editReply("no playlist id found in url"); }
			let { title, items } = (await yt.pl(playlistID, { limit: Infinity, pages: Infinity }));

			audioManager = audioManager || new discordaudio.AudioManager();
			for await (let item of items.map(item => item.shortUrl))
				if (!connections.get(vc) || !audioManager.queue(vc).find(x => x.url == item)) await audioManager.play(vc, song);
			connections.set(vc, audioManager);
			audioManager.on("end", vc => connections.delete(vc));
			await interaction.editReply(`added ${items.length} songs from "${title}" to queue`);

			break;
		case "pause":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			await interaction.editReply(`paused "${(await audioManager.queue(vc))[0].title}"`);
			audioManager.pause(vc);
			break;
		case "resume":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			await interaction.editReply(`resumed "${(await audioManager.queue(vc))[0].title}"`);
			audioManager.resume(vc);
			break;
		case "skip":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			await interaction.editReply(`skipped "${(await audioManager.queue(vc))[0].title}"`);
			if (audioManager.queue(vc).length == 1) connections.delete(vc);
			await audioManager.skip(vc);
			break;
		case "stop":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");
			await audioManager.stop(vc);
			await interaction.editReply("stopped");
			connections.delete(vc);
			break;
		case "queue":
			if (!audioManager) return await interaction.editReply("nothing is playing in the voice channel you're in");

			async function generateEmbed(selection = 0, ended) {
				if (!connections.get(vc)) return { components: [], content: "queue is empty", embeds: [] };
				let queue = audioManager.queue(vc),
					description = "";
				queue.forEach((song, index) => description += `${(index == selection) ? "**" : ""}${index + 1}${(index == selection) ? "**" : ""} - [${song.title}](${song.url})${index == 0 ? " - now playing" : ""}\n` );
				let queueEmbed = components.queueEmbed(description),
					row = components.queueButtons(ended, selection, queue);
				return { components: [ row ], embeds: [ queueEmbed ] };
			}
			await interaction.editReply(await generateEmbed());

			let selection = 0;
			(async function updateEmbed() {
				try {
					let buttonInteraction = (await client.channels.cache.get(interaction.channelId).awaitMessageComponent({ componentType: ComponentType.Button, time: 10000 }));
					switch (buttonInteraction.customId) {
						case "end":
							await buttonInteraction.update(await generateEmbed(selection, true));
							break;
						case "remove":
							await audioManager.deletequeue(vc, audioManager.queue(vc)[selection].url);
							if (selection > audioManager.queue(vc).length - 1) selection = audioManager.queue(vc).length - 1;
							await buttonInteraction.update(await generateEmbed(selection));
							return updateEmbed();
						case "next":
							selection++;
							await buttonInteraction.update(await generateEmbed(selection));
							return updateEmbed();
						case "prev":
							selection--;
							await buttonInteraction.update(await generateEmbed(selection));
							return updateEmbed();
					}
				} catch (err) {
					await interaction.editReply(await generateEmbed(selection, true));
					await interaction.followUp({ components: [], content: "interaction ended due to inactivity", embeds: [], ephemeral: true })
				}
			})();

			break;
	}
}