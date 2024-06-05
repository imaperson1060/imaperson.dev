import { Client, Collection, GatewayIntentBits } from "discord.js";
const client = new Client({ "intents": [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates ] });

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

import fs from "fs";

export default async function () {
	fs.readdirSync("./discord/personbot/events/").forEach(async file => {
		let event = await import(`./events/${file}`);
		let eventName = file.split(".")[0];
		client.on(eventName, event.default.bind(null, client));
	});

	client.commands = new Collection();
	fs.readdirSync("./discord/personbot/commands/").forEach(async file => {
		let props = await import(`./commands/${file}`);
		let commandName = file.split(".")[0];
		client.commands.set(commandName, props);
	});
	let rest = new REST({ version: "10" }).setToken(process.env.PERSONBOT_TOKEN);
	await rest.put(Routes.applicationCommands(process.env.PERSONBOT_ID), { body: [ (await import(`./application/update.js`)).data.toJSON() ] });

	client.login(process.env.PERSONBOT_TOKEN);
}