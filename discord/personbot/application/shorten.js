import { SlashCommandBuilder } from "@discordjs/builders";

export let requires = [];

export let data = new SlashCommandBuilder()
	.setName("shorten")
	.setDescription("Shorten a URL quickly and easily!")
	.addStringOption(option =>
		option.setName("url")
    		.setDescription("The URL you want to shorten.")
			.setRequired(true)
        )
	.addStringOption(option =>
    	option.setName("expiration")
			.setDescription("Amount of time until the link expires.")
			.setRequired(true)
            .addChoice("12 Hours", "12h")
            .addChoice("1 Day (24 Hours)", "1d")
            .addChoice("1 Week (7 Days)", "1w")
            .addChoice("1 Month (4 Weeks)", "1m")
            .addChoice("6 Months (24 Weeks)", "6m")
            .addChoice("1 Year (365 Days)", "1y")
            .addChoice("∞", "∞")
        )
    .addStringOption(option =>
        option.setName("domain")
            .setDescription("Choose between 5 different domains for your URL.")
            .setRequired(true)
            .addChoice("ariurls.tk", "tk")
            .addChoice("ariurls.gq", "gq")
            .addChoice("ariurls.cf", "cf")
            .addChoice("ariurls.ga", "ga")
            .addChoice("ariurls.ml", "ml")
        )
    .addStringOption(option =>
        option.setName("id")
            .setDescription("Leave blank for a random 5 digit ID.")
            .setRequired(false)
        )
    .addBooleanOption(option =>
        option.setName("hide")
            .setDescription("Hide the response message from everybody but you.")
            .setRequired(false)
        )