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
        .addChoices(
          { name: "12 Hours", value: "12h" },
          { name: "1 Day (24 Hours)", value: "1d" },
          { name: "1 Week (7 Days)", value: "1w" },
          { name: "1 Month (4 Weeks)", value: "1m" },
          { name: "6 Months (24 Weeks)", value: "6m" },
          { name: "1 Year (365 Days)", value: "1y" },
          { name: "∞", value: "∞" }
        )
        .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("domain")
      .setDescription("Choose between 5 different domains for your URL.")
      .addChoices(
        { name: "imaurl.tk", value: "tk" },
        { name: "imaurl.gq", value: "gq" },
        { name: "imaurl.cf", value: "cf" },
        { name: "imaurl.ga", value: "ga" },
        { name: "imaurl.ml", value: "ml" }
      )
      .setRequired(true)
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