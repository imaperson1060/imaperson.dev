import mysql from "mysql";
import util from "util";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "yt" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

let yt = { dl: ytdl, pl: ytpl, sr: ytsr };

export async function getVideoDetails(id, cookie) {
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

export default async (req, res) => {
	switch (req.method) {
		case "GET":
			let id, cookie = req.get("auth"); // cookies are stored in temporary cache and *never* permanently saved
			if (req.query.url) {
				try { id = yt.dl.getURLVideoID(req.query.url); }
				catch (e) { return res.status(400).json({ success: false, code: 400, error: "no video id found in url", args: req.query }); }
			} else id = req.query.id;
			if (!id) return res.status(400).json({ success: false, code: 400, error: "no video id provided", args: req.query });
			let video = await getVideoDetails(id, cookie);

			if (req.query.go) return res.redirect(video.code == 200 ? video.formats.download : "https://imaperson.dev/yt");
			else if (req.query.audio) return res.redirect(video.code == 200 ? video.formats.audio : "https://imaperson.dev/yt");
			else if (video.code != 200) return res.status(video.code).json({ success: false, code: video.code, error: video.error, args: req.query });
			return res.status(200).json({ success: true, code: 200, video: { id, title: video.title, description: video.description, author: { name: video.author.display, username: video.author.username }, formats: video.formats }, args: req.query });
		default: return res.status(405).json({ success: false, code: 405, error: "method not allowed", args: req.body });
	}
}