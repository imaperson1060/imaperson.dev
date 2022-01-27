import { Client, Collection } from "discord.js";
const client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });

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

    (async function setCmds () {
        if (commands.length != fs.readdirSync("./discord/personbot/commands/").length) return setTimeout(() => setCmds(), 100);

        await rest.put(
            Routes.applicationCommands(process.env.PERSONBOT_ID), { body: commands },
            Routes.applicationGuildCommands(process.env.PERSONBOT_ID, process.env.PERSONBOT_TESTING_GUILD_ID), { body: commands },
        );
    })();

    client.login(process.env.PERSONBOT_TOKEN);
}