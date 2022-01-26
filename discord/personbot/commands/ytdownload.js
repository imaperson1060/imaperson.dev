import mysql from "mysql";
import urlexists from "url-exists";
import util from "util";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";

var urlExists = util.promisify(urlexists).bind(urlexists);

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "yt" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

const yt = { dl: ytdl, pl: ytpl, sr: ytsr };

async function getVideoDetails(id, cookie) {
    const db = (await query("SELECT * FROM `videos` WHERE id=?", [id]))[0];
    if (db && db.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
        return { success: true, formats: JSON.parse(decodeURIComponent(db.formats)), author: decodeURIComponent(db.author), title: decodeURIComponent(db.title), description: decodeURIComponent(db.description), thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
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
        if (!videoInfo.videoDetails.isPrivate) await query("UPDATE `videos` SET author=?, title=?, description=?, formats=? WHERE video=?", [encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description), JSON.stringify(formats), id]);
    } else {
        await query("ALTER TABLE `videos` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `videos`"))[0].max]);
        if (!videoInfo.videoDetails.isPrivate) await query("INSERT INTO `videos`(`video`, `author`, `title`, `description`, `formats`) VALUES (?,?,?,?,?)", [id, encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description) || "", JSON.stringify(formats)])
    }

    return { success: true, formats: formats, info: { author: videoInfo.videoDetails.author.name, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` } };
}

function getId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });
    
    var id = getId(options.find(x => x.name == "video").value);

    if (!(await urlExists(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${id}`))) return await interaction.editReply("The video submitted does not exist.");

    const videoInfo = await getVideoDetails(id);

    if (options.find(x => x.name == "format").value == "mp4") {
        const videoEmbed = {
            color: "#0099ff",
            author: {
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
                url: "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands"
            },
            title: `${videoInfo.info.title} by ${videoInfo.info.author}`,
            url: `https://youtu.be/${id}`,
            description: videoInfo.info.description,
            fields: [
                {
                    name: '\u200B',
                    value: '\u200B'
                },
                {
                    name: "Download link",
                    value: `[Download the video](${videoInfo.formats.hd ? videoInfo.formats.hd : videoInfo.formats.sd}) (link expires in 6 hours)`
                }
            ],
            timestamp: new Date(),
            footer: {
                icon_url: "https://arimeisels.com/favicon.png",
                text: "PersonBot by imaperson#1060"
            }
        }

        await interaction.editReply({ embeds: [ videoEmbed ] });
    } else {
        const audioEmbed = {
            color: "#0099ff",
            author: {
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
                url: "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands"
            },
            title: `${videoInfo.info.title} by ${videoInfo.info.author}`,
            url: `https://youtu.be/${id}`,
            description: videoInfo.info.description,
            fields: [
                {
                    name: '\u200B',
                    value: '\u200B'
                },
                {
                    name: "Download link",
                    value: `[Download the audio](${videoInfo.formats.audio}) (link expires in 6 hours)`
                }
            ],
            timestamp: new Date(),
            footer: {
                icon_url: "https://arimeisels.com/favicon.png",
                text: "PersonBot by imaperson#1060"
            }
        }

        await interaction.editReply({ embeds: [ audioEmbed ] });
    }
}