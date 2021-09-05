const { Client, MessageEmbed } = require("discord.js"),
      client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

client.login(process.env.SHORTCUTTERBOT);

client.on("ready", () => {
	client.user.setActivity("Shortcutter | >help");

	console.log("Shortcutter ready!");
});

client.on("interactionCreate", interaction => {
	if (!interaction.isCommand()) return;

	var options = interaction.options._hoistedOptions;

	switch (interaction.commandName) {
		case "shortcut":
			(async function () {
				await interaction.deferReply({ ephemeral: false });

				if (findObjectByKey(options, "name", "user")) {
		            return await interaction.editReply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts can lead to anywhere.",  files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/users/${findObjectByKey(options, "name", "user").user.id}\r\nIconFile=https://cdn.discordapp.com/icons/${findObjectByKey(options, "name", "user").member.guild.id}/${findObjectByKey(options, "name", "user").member.guild.icon}.webp\r\nIconIndex=0`, "utf-8"), name: `${findObjectByKey(options, "name", "user").user.username}.url` } ] });
        		} else if (findObjectByKey(options, "name", "channel")) {
		            return await interaction.editReply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts can lead to anywhere.", files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/channels/${findObjectByKey(options, "name", "channel").channel.guildId}/${findObjectByKey(options, "name", "channel").value}\r\nIconFile=https://cdn.discordapp.com/icons/${findObjectByKey(options, "name", "channel").channel.guild.id}/${findObjectByKey(options, "name", "channel").channel.guild.icon}.webp\r\nIconIndex=0`, "utf-8"), name: `${findObjectByKey(options, "name", "channel").channel.name}.url` } ] });
        		} else {
					return await interaction.editReply({ content: "**WARNING:**\nBrowsers will block the shortcut because internet shortcuts can lead to anywhere.", files: [ { attachment: Buffer.from(`[InternetShortcut]\r\nURL=discord://discordapp.com/channels/${interaction.member.guild.id}/${interaction.channelId}\r\nIconFile=https://cdn.discordapp.com/icons/${interaction.member.guild.id}/${interaction.member.guild.icon}.webp\r\nIconIndex=0`, "utf-8"), name: `${client.channels.cache.get(interaction.channelId).name}.url` } ] });
        		}
			})();

			break;
		case "help":
			(async function () {
				await interaction.deferReply({ ephemeral: false });

				const help = new MessageEmbed()
                    .setColor("#7289DA")
                    .setAuthor("Shortcutter", "https://cdn.discordapp.com/app-icons/838967702872916000/3904dbced0ef3498599f443848a0fa29.png?size=256", "https://discord.com/api/oauth2/authorize?client_id=838967702872916000&permissions=2147483648&scope=applications.commands%20bot")
                    .setDescription("This bot was created by imaperson#1060!")
                    .addFields(
                        { name: "Use the bot", value: "Type */shortcut* in any channel the bot can send messages in to use.\nYou can also provide a user or a different channel to link to there." },
						{ name: "Invite it here:", value: "[https://discord.com/api/oauth2/authorize?client_id=838967702872916000&permissions=2147483648&scope=applications.commands%20bot](https://discord.com/api/oauth2/authorize?client_id=838967702872916000&permissions=2147483648&scope=applications.commands%20bot)" }
                    )
                    .setTimestamp()
                    .setFooter("© imaperson#1060", "https://api.arimeisels.com/favicon.png");

				interaction.editReply({ embeds: [ help ] });
			})();

			break;
	}
});

function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}
