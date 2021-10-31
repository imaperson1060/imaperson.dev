export default async function (client, interaction, options) {
    const isReachable = require("is-reachable");
    const ytdl = require("ytdl-core");

    await interaction.deferReply({ ephemeral: true });
    
    function getId(url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        var match = url.match(regExp);
        return (match && match[7].length == 11) ? match[7] : false;
    }        

    var id = getId(findObjectByKey(options, "name", "video").value);

    if (!(await isReachable(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`))) return await interaction.editReply("The video submitted does not exist.");

    const videoInfo = await ytdl.getInfo(id);
    
    var hd;
    try { hd = findObjectByKey(videoInfo.formats, "itag", 22).url; } catch (e) {}
    var sd = findObjectByKey(videoInfo.formats, "itag", 18).url;
    var audio = findObjectByKey(videoInfo.formats, "itag", 140).url;

    if (findObjectByKey(options, "name", "format").value == "mp4") {
        const videoEmbed = {
            color: "#0099ff",
            author: {
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
                url: "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands"
            },
            title: `${videoInfo.videoDetails.title} by ${videoInfo.videoDetails.author.name}`,
            url: `https://youtu.be/${id}`,
            description: videoInfo.videoDetails.description,
            fields: [
                {
                    name: '\u200B',
                    value: '\u200B'
                },
                {
                    name: "Video URL",
                    value: `[Download the video](${hd ? hd : sd}) (link expires in 6 hours)`
                }
            ],
            timestamp: new Date(),
            footer: {
                icon_url: "https://api.arimeisels.com/favicon.png",
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
            title: `${videoInfo.videoDetails.title} by ${videoInfo.videoDetails.author.name}`,
            url: `https://youtu.be/${id}`,
            description: videoInfo.videoDetails.description,
            fields: [
                {
                    name: '\u200B',
                    value: '\u200B'
                },
                {
                    name: "Video URL",
                    value: `[Download the audio](${audio}) (link expires in 6 hours)`
                }
            ],
            timestamp: new Date(),
            footer: {
                icon_url: "https://api.arimeisels.com/favicon.png",
                text: "PersonBot by imaperson#1060"
            }
        }

        await interaction.editReply({ embeds: [ audioEmbed ] });
    }

    function findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }
}