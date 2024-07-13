import { ComponentType } from "discord.js";
import mysql from "mysql";
import util from "util";
import ytdl from "@distube/ytdl-core";

import * as components from "../components/ytdownload.js";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "yt" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

async function getVideoDetails(id) {
	let video = (await query("SELECT * FROM `videos` WHERE id=?", [ id ]))[0];
	if (video && video.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) return { code: 200, id, title: JSON.parse(decodeURIComponent(video.title)), description: JSON.parse(decodeURIComponent(video.description)), author: JSON.parse(decodeURIComponent(video.author)), formats: JSON.parse(decodeURIComponent(video.formats)) };

	let videoInfo;
	try { videoInfo = await ytdl.getInfo(id); }
	catch (e) {
		if (e.toString().indexOf("private video") != -1) return { code: 401, error: "this video is private" };
		else if (e.toString().indexOf("video id found") != -1 || e.toString().indexOf("unavailable") != -1) return { code: 404, error: "video not found" };
		else return { code: 500, error: "an unknown error occurred" };
	}

	let formats = { download: videoInfo.formats.filter(video => video.hasVideo && video.hasAudio).sort((a, b) => b.height * b.width - a.height * a.width)[0].url, video: videoInfo.formats.filter(video => video.hasVideo && !video.hasAudio).sort((a, b) => b.height * b.width - a.height * a.width)[0].url, audio: videoInfo.formats.filter(x => !x.hasVideo && x.hasAudio).sort((a, b) => b.audioBitrate - a.audioBitrate)[0].url };
	if (videoInfo.videoDetails.isPrivate);
	else if ((await query("SELECT * FROM `videos` WHERE id=?", [id]))[0]) await query("UPDATE `videos` SET `title`=?, `description`=?, `author`=?, `formats`=?, `timestamp`=? WHERE `id`=?", [ encodeURIComponent(JSON.stringify(videoInfo.videoDetails.title)), encodeURIComponent(JSON.stringify(videoInfo.videoDetails.description)), encodeURIComponent(JSON.stringify({ display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user })), encodeURIComponent(JSON.stringify(formats)), Math.round(new Date().getTime() / 1000), id ]);
	else await query("INSERT INTO `videos`(`id`, `title`, `description`, `author`, `formats`, `timestamp`) VALUES (?,?,?,?,?,?)", [ id, encodeURIComponent(JSON.stringify(videoInfo.videoDetails.title)), encodeURIComponent(JSON.stringify(videoInfo.videoDetails.description)), encodeURIComponent(JSON.stringify({ display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user })), encodeURIComponent(JSON.stringify(formats)), Math.round(new Date().getTime() / 1000) ]);

	return { code: 200, id, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, author: { display: videoInfo.videoDetails.author.name, username: videoInfo.videoDetails.author.user }, formats };
}

export default async function (client, interaction, options) {
	await interaction.deferReply({ ephemeral: true });

	let id = options.find(x => x.name == "video").value;
	try { id = ytdl.getURLVideoID(id); }
	catch (e) { return await interaction.editReply("no video id found in url"); }
	let video = await getVideoDetails(id);

	let more = false;
	if (video.code == 200) await interaction.editReply({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, video, id, more) ] });
	else if (video.code == 401) return await interaction.editReply({ components: [ components.openWebsite ], content: "this video is private, and requires cookies to download. this feature is only available on the website." });
	else if (video.code == 404) return await interaction.editReply("video not found");
	else return await interaction.editReply("an unknown error occurred");
	(async function updateEmbed() {
		try {
			let buttonInteraction = (await interaction.channel.awaitMessageComponent({ filter: x => x.message.interaction.id == interaction.id, componentType: ComponentType.Button, time: 10000 }));
			switch (buttonInteraction.customId) {
				case "download":
					await buttonInteraction.update({ components: [ components.downloadButtons(id, video.formats, false) ], embeds: [ components.videoEmbed(client, video, id, more) ] });
					return updateEmbed();
				case "more":
					more = true;
					await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, video, id, more) ] });
					return updateEmbed();
				case "less":
					more = false;
					await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, video, id, more) ] });
					return updateEmbed();
				case "back":
					await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, video, id, more) ] });
					return updateEmbed();
			}
		} catch (err) {
			await interaction.editReply({ components: [ components.downloadButtons(id, video.formats, true) ], embeds: [ components.videoEmbed(client, video, id) ] });
			await interaction.followUp({ components: [], content: "interaction ended due to inactivity", embeds: [], ephemeral: true });
		}
	})();
}