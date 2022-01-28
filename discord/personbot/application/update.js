import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("update")
	.setDescription("Update your server's slash commands based on PersonBot's permissions")