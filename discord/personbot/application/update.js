import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("update")
	.setDescription("update your server's slash commands based on personbot's permissions");