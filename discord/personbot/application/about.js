const { SlashCommandBuilder } = require("@discordjs/builders");

exports.data = new SlashCommandBuilder()
	.setName("about")
	.setDescription("Information about the bot.")