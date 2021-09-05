const { Client, Collection } = require("discord.js");
const client = new Client({ "intents": ["GUILDS", "GUILD_MESSAGES"] });

require("fs").readdirSync("./discord/personbot/events/").forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
});

client.commands = new Collection();

require("fs").readdirSync("./discord/personbot/commands/").forEach(file => {
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    client.commands.set(commandName, props);
});
    
client.login(process.env.PERSONBOT_TOKEN);