import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("shorten")
	.setDescription("shorten urls for free")
	.addStringOption(option =>
		option.setName("url")
			.setDescription("the url to be shortened")
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName("expiration")
			.setDescription("amount of time until the link expires")
			.addChoices(
				{ name: "12 Hours", value: "12h" },
				{ name: "1 Day", value: "1d" },
				{ name: "1 Week", value: "1w" },
				{ name: "1 Month", value: "1m" },
				{ name: "6 Months", value: "6m" },
				{ name: "1 Year", value: "1y" },
				{ name: "indefinite (in this case, largest 32-bit integer)", value: "max" }
			)
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName("domain")
			.setDescription("choose between 3 different domains for your url")
			.addChoices(
				{ name: "imaurl.tk", value: "tk" },
				{ name: "imaurl.cf", value: "cf" },
				{ name: "imaurl.gq", value: "gq" }
			)
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName("id")
			.setDescription("leave blank for a random 5 digit id")
			.setRequired(false)
	)
	.addStringOption(option =>
		option.setName("editkey")
			.setDescription("input your edit key if you have one")
			.setRequired(false)
	);