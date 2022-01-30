import discordaudio from "discordaudio";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import mysql from "mysql";
import util from "util";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";
import { connect } from "http2";
import { BurstyRateLimiter } from "rate-limiter-flexible";

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

const connections = new Map();

export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: true });

    const vc = interaction.member.voice.channel;

    if (!vc) return await interaction.editReply("You are not in a voice channel.");
    
    switch (interaction.options._subcommand) {
        case "endloop":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");
            
            audioManager.loop(vc, audioManager.looptypes.off);

            await interaction.editReply("Stopped loop");

            break;
        case "loop":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            audioManager.loop(vc, audioManager.looptypes.loop);

            var playing = (await audioManager.queue(vc))[0].title;
            await interaction.editReply(`Looping "${playing}"`);

            break;
        case "loopqueue":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            audioManager.loop(vc, audioManager.looptypes.off);

            await interaction.editReply("Looping queue");

            break;
        case "play":
            if (!yt.dl.validateURL(options.find(x => x.name == "song").value)) return await interaction.editReply("The song submitted does not exist.");

            var id = yt.dl.getVideoID(options.find(x => x.name == "song").value);
            
            const songInfo = (await getVideoDetails(id)).info;
            
            var audioManager = connections.get(vc) || new discordaudio.AudioManager();
            
            if (connections.get(vc) && audioManager.queue(vc).find(x => x.url == options.find(x => x.name == "song").value)) return await interaction.editReply("The song submitted is already in the queue or is playing.");
            
            const manager = await audioManager.play(vc, options.find(x => x.name == "song").value, { // You're probably wondering why I'm using a 3rd party library for streaming the actual song. The reason is whenever I do it from the URL I get it just cuts out randomly. I don't know how this does it better (hopefully not by downloading it) but it works.
                autoleave: true,
                quality: "high"
            });
            
            connections.set(vc, audioManager);

            audioManager.on("end", vc => connections.delete(vc));

            if (!manager) await interaction.editReply(`Playing "${songInfo.title}" in :loud_sound: ${client.channels.cache.get(vc.id).name}`);
            else await interaction.editReply(`Added "${songInfo.title}" to queue`);

            break;
        case "pause":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            audioManager.pause(vc);

            var playing = (await audioManager.queue(vc))[0].title;
            await interaction.editReply(`Paused "${playing}"`);

            break;
        case "resume":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            audioManager.resume(vc);

            var playing = (await audioManager.queue(vc))[0].title;
            await interaction.editReply(`Resumed "${playing}"`);

            break;
        case "skip":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            var playing = (await audioManager.queue(vc))[0].title;

            await audioManager.skip(vc);

            await interaction.editReply(`Skipped "${playing}"`);

            break;
        case "stop":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            await audioManager.stop(vc);
            await interaction.editReply("Stopped");

            connections.delete(vc);
            break;
        case "queue":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            async function generateEmbed(selection = 0, ended) {
                const queue = audioManager.queue(vc);

                const queueEmbed = new MessageEmbed()
                    .setTitle("Queue");

                var description = "";
                queue.forEach((x, i) => description += `${(i == selection) ? "**" : ""}${i + 1}${(i == selection) ? "**" : ""} - [${x.title}](${x.url})${i == 0 ? " - Now Playing" : ""}\n` );
                queueEmbed.setDescription(description);

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId("prev")
                            .setEmoji("937226629439176725")
                            .setStyle("PRIMARY")
                            .setDisabled(ended || selection == 0),
                        new MessageButton()
                            .setCustomId("next")
                            .setEmoji("937226629581791252")
                            .setStyle("PRIMARY")
                            .setDisabled(ended || selection == queue.length - 1),
                        new MessageButton()
                            .setCustomId("remove")
                            .setEmoji("937227759904780299")
                            .setStyle("DANGER")
                            .setDisabled(ended || selection == 0),
                        new MessageButton()
                            .setCustomId("end")
                            .setLabel("End Interaction")
                            .setStyle("DANGER")
                            .setDisabled(ended || false),
                    )

                return { components: [ row ], embeds: [ queueEmbed ] };
            }

            await interaction.editReply(await generateEmbed());

            var selection = 0;

            (async function updateEmbed() {
                try {
                    const buttonInteraction = (await client.channels.cache.get(interaction.channelId).awaitMessageComponent({ componentType: "BUTTON", time: 10000 }));
                    
                    const btn = buttonInteraction.customId;

                    switch (btn) {
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
                    await interaction.followUp({ components: [ ], content: "Interaction ended due to inactivity", embeds: [ ], ephemeral: true })
                }
            })();

            break;
        case "volume":
            var audioManager = connections.get(vc);
            if (!audioManager) return await interaction.editReply("I'm not playing anything in the voice channel you're in.");

            audioManager.volume(vc, options.find(x => x.name == "new").value);
            break;
    }
}