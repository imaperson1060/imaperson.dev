module.exports = (query) => {
    const { Client, MessageAttachment, MessageEmbed } = require("discord.js");
    const client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

    const isReachable = require("is-reachable");
    const ytdl = require("ytdl-core");

    client.on("ready", async () => {
        console.log("PersonBot ready!");
    });

    client.on("interactionCreate", interaction => {
        if (!interaction.isCommand()) return;

        var options = interaction.options._hoistedOptions;

        switch (interaction.commandName) {
            case "shorten":
                (async function () {
                    await interaction.deferReply({ ephemeral: false });

                    var url = ((findObjectByKey(options, "name", "url").value.startsWith("http://") ? findObjectByKey(options, "name", "url").value.slice(7) : (findObjectByKey(options, "name", "url").value.startsWith("https://") ? findObjectByKey(options, "name", "url").value.slice(8) : findObjectByKey(options, "name", "url").value)));
                    var expiration = findObjectByKey(options, "name", "expiration").value;
                    var id = (findObjectByKey(options, "name", "id") ? findObjectByKey(options, "name", "id").value : undefined);
                    var domain = findObjectByKey(options, "name", "domain").value;
                    var expirations = {
                        "12h": 43200,
                        "1d": 86400,
                        "1w": 604800,
                        "1m": 2419200,
                        "6m": 14515200,
                        "1y": 31536000,
                        "∞": 2147483647
                    }
                    
                    var https = await isReachable(`https://${decodeURIComponent(url)}`);
                    var http = await isReachable(`http://${decodeURIComponent(url)}`);

                    if (!https && !http) {
                        return await interaction.editReply("That website kinda doesn't exist, or it cannot be detected by me. Sorry!");
                    }

                    if (id) {
                        if ((await query("SELECT * FROM `short` WHERE `id`=?", [id]))[0]) {
                            await interaction.editReply("That ID is already in use!");
                            return;
                        } else {
                            await query("INSERT INTO `short` (`id`, `longurl`, `domain`, `username`, `expiration`) VALUES (?, ?, ?, ?, ?)", [id, (https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`), domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);
                            await interaction.editReply(`Shortened to https://ariurls.${domain}/${id} !`);
                            return;
                        }
                    } else {
                        var characters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];

                        async function generateURL() {
                            var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];
                            
                            if (await query("SELECT * FROM `short` WHERE `id`=?", [randomString])[0]) {
                                generateURL();
                            } else {
                                await query("INSERT INTO `short` (`id`, `longurl`, `domain`, `username`, `expiration`) VALUES (?, ?, ?, ?, ?)", [randomString, (https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`), domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);
                                await interaction.editReply(`Shortened to https://ariurls.${domain}/${randomString} !`);
                                return;
                            }
                        }
                        
                        generateURL();
                    }
                })();

                break;
            case "ytdownload":
                (async function () {
                    await interaction.deferReply({ ephemeral: true });

                    function getId(url) {
                        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
                        var match = url.match(regExp);
                        return (match && match[7].length == 11) ? match[7] : false;
                    }        

                    var id = getId(findObjectByKey(options, "name", "video").value);

                    if (!(await isReachable(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`))) return await interaction.editReply("The video submitted does not exist.");

                    var videoInfo = await ytdl.getInfo(id);
                    if (findObjectByKey(options, "name", "format").value == "mp4") {
                        try {
                            let hd = findObjectByKey(videoInfo.formats, "itag", 22).url;
                            
                            const videoEmbed = new MessageEmbed()
	                            .setColor("#0099ff")
	                            .setTitle(`${videoInfo.videoDetails.title} by ${videoInfo.videoDetails.author.name}`)
	                            .setURL(`https://youtu.be/${id}`)
	                            .setAuthor("PersonBot", "https://cdn.discordapp.com/app-icons/882471379910426664/3a4d36c555b824240128072238f828e0.png?size=256", "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands")
	                            .setDescription(videoInfo.videoDetails.description)
	                            .setThumbnail(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
                                .addFields(
                                    { name: '\u200B', value: '\u200B' },
                                    { name: "Video URL", value: `[Download the video](${hd}) (link expires in 6 hours)` }
                                )
	                            .setTimestamp()
	                            .setFooter("PersonBot by imaperson#1060", "https://api.arimeisels.com/favicon.png");
                            
                            await interaction.editReply({ embeds: [ videoEmbed ] });
                        } catch(err) {
                            try {
                                let sd = findObjectByKey(videoInfo.formats, "itag", 18).url;
                            
                                const videoEmbed = new MessageEmbed()
                                    .setColor("#0099ff")
                                    .setTitle(`${videoInfo.videoDetails.title} by ${videoInfo.videoDetails.author.name}`)
                                    .setURL(`https://youtu.be/${id}`)
                                    .setAuthor("PersonBot", "https://cdn.discordapp.com/app-icons/882471379910426664/3a4d36c555b824240128072238f828e0.png?size=256", "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands")
                                    .setDescription(videoInfo.videoDetails.description)
                                    .setThumbnail(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
                                    .addFields(
                                        { name: '\u200B', value: '\u200B' },
                                        { name: "Video URL", value: `[Download the video](${sd}) (link expires in 6 hours)` }
                                    )
                                    .setTimestamp()
                                    .setFooter("PersonBot by imaperson#1060", "https://api.arimeisels.com/favicon.png");
                                
                                await interaction.editReply({ embeds: [ videoEmbed ] });
                            } catch(err) {
                                await interaction.editReply("There was an error fetching your video. Send me a DM so I can try to fix it!");
                            }
                        }
                    } else {
                        try {
                            let audio = findObjectByKey(videoInfo.formats, "itag", 140).url;
                            
                            const videoEmbed = new MessageEmbed()
                                .setColor("#0099ff")
                                .setTitle(`${videoInfo.videoDetails.title} by ${videoInfo.videoDetails.author.name}`)
                                .setURL(`https://youtu.be/${id}`)
                                .setAuthor("PersonBot", "https://cdn.discordapp.com/app-icons/882471379910426664/3a4d36c555b824240128072238f828e0.png?size=256", "https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands")
                                .setDescription(videoInfo.videoDetails.description)
                                .setThumbnail(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
                                .addFields(
                                    { name: '\u200B', value: '\u200B' },
                                    { name: "Video URL", value: `[Download the audio](${audio}) (link expires in 6 hours)` }
                                )
                                .setTimestamp()
                                .setFooter("PersonBot by imaperson#1060", "https://api.arimeisels.com/favicon.png");
                                
                            await interaction.editReply({ embeds: [ videoEmbed ] });
                        } catch(err) {
                            await interaction.editReply("There was an error fetching your video. Send me a DM so I can try to fix it!");
                        }
                    }
                })();

                break;
            case "about":
                (async function () {
                    await interaction.deferReply({ ephemeral: true });

                    await interaction.editReply(`**PERSONBOT** by imaperson#1060\nInvite: https://discord.com/api/oauth2/authorize?client_id=882471379910426664&permissions=2147483648&scope=bot%20applications.commands`);
                })();

                break;
        }
    });
    
    client.login(process.env.PERSONBOT_TOKEN);

    function findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }
}