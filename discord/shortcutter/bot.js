const { Client, MessageAttachment } = require("discord.js"),
      client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

client.login(process.env.SHORTCUTTERBOT);

client.on("ready", () => {
	client.user.setActivity("Shortcutter | >help", { type: "PLAYING" });
});

client.on("messageCreate", (message) => {
    if (message.content.startsWith(">shortcut")) {
        if (message.mentions.members.first()) {
            message.reply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts are commonly used for scams.",  files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/users/${message.mentions.members.first().id}\r\nIconFile=${message.guild.iconURL()}\r\nIconIndex=0`, "utf-8"), name: `${message.mentions.members.first().user.username}.url` } ] });
        } else if (message.mentions.channels.first()) {
            message.reply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts are commonly used for scams.", files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/channels/${message.guild.id}/${message.mentions.channels.first().id}\r\nIconFile=${message.guild.iconURL()}\r\nIconIndex=0`, "utf-8"), name: `${message.mentions.channels.first().name}.url` } ] });
        } else {
			message.reply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts are commonly used for scams.", files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/channels/${message.guild.id}/${message.channel.id}\r\nIconFile=${message.guild.iconURL()}\r\nIconIndex=0`, "utf-8"), name: `${message.channel.name}.url` } ] });
        }
	}

	if (message.content == ">help") {
		message.reply({
			embeds: [{
				"color": "#7289DA",
				"author": {
					"name": "Shortcutter",
					"icon_url": "https://avatars3.githubusercontent.com/u/68653653?s=48&v=4"
				},
				"title": "This bot was created by imaperson!",
				"fields": [{
					"name": "Use the bot:",
					"value": "Type *>shortcut* in any channel the bot can send messages in to use.\nYou can also mention a user or a different channel to link to there."
				},
				{
					"name": "Invite it here:",
					"value": "[https://discord.com/api/oauth2/authorize?client_id=838967702872916000&permissions=34816&scope=bot](https://discord.com/api/oauth2/authorize?client_id=838967702872916000&permissions=34816&scope=bot)"
				}],
				"timestamp": new Date(),
				"footer": {
					"text": "© imaperson"
				}
			}]
		});
	}
});
