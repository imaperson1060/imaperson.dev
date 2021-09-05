const { Client, Collection } = require("discord.js");
const client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const fs = require("fs");

fs.readdirSync("./discord/personbot/events/").forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
});

client.commands = new Collection();

fs.readdirSync("./discord/personbot/commands/").forEach(file => {
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    client.commands.set(commandName, props);
});

const commands = [];

fs.readdirSync("./discord/personbot/application/").forEach(file => {
    const command = require(`./application/${file}`);
    commands.push(command.data.toJSON());
});

const rest = new REST({ version: "8" }).setToken(process.env.PERSONBOT_TOKEN);

(async () => {
	await rest.put(
		Routes.applicationCommands("882471379910426664"), { body: commands },
	);
})();
    
client.login(process.env.PERSONBOT_TOKEN);