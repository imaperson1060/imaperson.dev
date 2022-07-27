import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

const videoEmbed = (client, videoInfo, id, more) => new EmbedBuilder()
    .setTitle(`${videoInfo.info.title} by ${videoInfo.info.author}`)
    .setDescription(more ? videoInfo.info.description : "Press \"View more info\" for more")
    .setURL(`https://youtu.be/${id}`)
    .setAuthor({
        name: client.user.username,
        iconURL: client.user.displayAvatarURL(),
        url: "https://imaperson.dev/personbot"
    })
    .setColor("#0099ff")
    .setImage(videoInfo.info.thumbnail)
    .setTimestamp()
    .setFooter({
        text: "PersonBot by imaperson.exe#1060",
        icon_url: "https://imaperson.dev/favicon.png"
    });

const buttons = (more) => new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId("download")
            .setLabel("Download")
            .setEmoji("⬇️")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(!more ? "more" : "less")
            .setLabel(`View ${!more ? "more" : "less"} info`)
            .setEmoji("ℹ️")
            .setStyle(ButtonStyle.Primary)
    );

const downloadButtons = (id, cookie) => new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setLabel("mp4")
            .setURL(cookie || `https://api.imaperson.dev/yt/watch/${id}`)
            .setEmoji("🎦")
            .setStyle(ButtonStyle.Link)
            .setDisabled(!!cookie),
        new ButtonBuilder()
            .setLabel("mp3")
            .setURL(cookie || `https://api.imaperson.dev/yt/watch/${id}`)
            .setEmoji("💿")
            .setStyle(ButtonStyle.Link)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("back")
            .setLabel("Back")
            .setEmoji("◀️")
            .setStyle(ButtonStyle.Secondary)
    );

const learnCookies = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setLabel("Find cookies")
            .setURL("https://imaperson.dev/yt/getcookies")
            .setEmoji("🍪")
            .setStyle(ButtonStyle.Link)
    )

export { videoEmbed, buttons, downloadButtons, learnCookies };