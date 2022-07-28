import { ComponentType } from "discord.js";
import mysql from "mysql";
import urlexists from "url-exists";
import util from "util";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";

import * as components from "../components/ytdownload.js";

var urlExists = util.promisify(urlexists).bind(urlexists);

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "yt" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

const yt = { dl: ytdl, pl: ytpl, sr: ytsr };

async function getVideoDetails(id, cookie) {
    const db = (await query("SELECT * FROM `videos` WHERE id=?", [id]))[0];
    if (db && db.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
        return { success: true, formats: JSON.parse(decodeURIComponent(db.formats)), author: decodeURIComponent(db.author), title: decodeURIComponent(db.title), description: decodeURIComponent(db.description), length: db.length, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
    }

    var videoInfo;
    if (cookie) {
        try {
            videoInfo = await yt.dl.getInfo(id, { requestOptions: { headers: { cookie } } });
        } catch (e) {
            return { success: false, message: "invalid_cookie", code: 403 };
        }
    } else {
        try {
            videoInfo = await yt.dl.getInfo(id);
        } catch (e) {
            if (e.statusCode == 410) return { success: false, message: "cookies_required", code: 410 };
            return { success: false, e };
        }
    }

    var hd;
    try { hd = videoInfo.formats.find(x => x.itag == 22).url; } catch (e) {}
    var sd = videoInfo.formats.find(x => x.itag == 18).url;
    var audio = videoInfo.formats.find(x => x.itag == 140).url;
    var formats = { hd, sd, audio };
    
    if ((await query("SELECT * FROM `videos` WHERE video=?", [id]))[0]) {
        if (!videoInfo.videoDetails.isPrivate) await query("UPDATE `videos` SET author=?, title=?, description=?, length=?, formats=? WHERE video=?", [encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description) || "", videoInfo.videoDetails.lengthSeconds, JSON.stringify(formats), id]);
    } else {
        await query("ALTER TABLE `videos` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `videos`"))[0].max]);
        if (!videoInfo.videoDetails.isPrivate) await query("INSERT INTO `videos`(`video`, `author`, `title`, `description`, `formats`) VALUES (?,?,?,?,?)", [id, encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description) || "", videoInfo.videoDetails.lengthSeconds, JSON.stringify(formats)])
    }

    return { success: true, formats: formats, info: { author: videoInfo.videoDetails.author.name, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, length: videoInfo.videoDetails.lengthSeconds, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` } };
}

function getId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });

    const id = getId(options.find(x => x.name == "video").value);
    const cookie = options.find(x => x.name == "cookie")?.value;

    const videoInfo = await getVideoDetails(id, cookie);

    let more = false;

    if (videoInfo.success) await interaction.editReply({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, videoInfo, id, more) ] });
    else return await interaction.editReply({ components: [ components.learnCookies ], content: "That video doesn't exist, or you need to provide cookies. You can learn how to get your YouTube cookies from the link below." });

    (async function updateEmbed() {
        try {
            const buttonInteraction = (await interaction.channel.awaitMessageComponent({ filter: x => x.message.interaction.id == interaction.id, componentType: ComponentType.Button, time: 10000 }));

            const btn = buttonInteraction.customId;

            switch (btn) {
                case "download":
                    await buttonInteraction.update({ components: [ components.downloadButtons(id) ], embeds: [ components.videoEmbed(client, videoInfo, id, more) ] });
                    return updateEmbed();
                case "more":
                    more = true;
                    await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, videoInfo, id, more) ] });
                    return updateEmbed();
                case "less":
                    more = false;
                    await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, videoInfo, id, more) ] });
                    return updateEmbed();
                case "back":
                    await buttonInteraction.update({ components: [ components.buttons(more) ], embeds: [ components.videoEmbed(client, videoInfo, id, more) ] });
                    return updateEmbed();
            }
        } catch (err) {
            await interaction.editReply({ components: [ ], embeds: [ components.videoEmbed(client, videoInfo, id) ] });
            await interaction.followUp({ components: [ ], content: "Interaction ended due to inactivity", embeds: [ ], ephemeral: true });
        }
    })();
}