import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
  .setName("about")
	.setDescription("Information about the bot.")