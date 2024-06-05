import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export default async function (client, interaction, options) {
	await interaction.deferReply();
	let commands = [];
	for await (const file of fs.readdirSync("./discord/personbot/application/")) {
		let command = await import(`../application/${file}`);
		if (interaction.guild.members.me.permissions.has(command.requires) && file != "update.js") commands.push(command.data.toJSON());
	}
	let rest = new REST({ version: "10" }).setToken(process.env.PERSONBOT_TOKEN);
	await rest.put(Routes.applicationGuildCommands(process.env.PERSONBOT_ID, interaction.guildId), { body: commands });

	return await interaction.editReply(`**slash commands updated!**\ncommands are:\n${commands.map(x => x = x.name).join("\n")}`);
}