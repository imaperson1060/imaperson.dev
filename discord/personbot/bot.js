import { Client, Collection } from "discord.js";
const client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

import fs from "fs";

export default function () {
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

    const commands = [];

    fs.readdirSync("./discord/personbot/application/").forEach(async file => {
        let command = await import(`./application/${file}`);
        commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: "8" }).setToken(process.env.PERSONBOT_TOKEN);

    (async () => {
    	await rest.put(
		    Routes.applicationCommands("882471379910426664"), { body: commands },
	    );
    })();

    client.login(process.env.PERSONBOT_TOKEN);
}