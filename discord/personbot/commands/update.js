import fs from "fs";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

const rateLimiter = new RateLimiterMemory({ points: 1, duration: 3600 });

export default async function (client, interaction, options) {
    await interaction.deferReply();

    try {
        await rateLimiter.consume(interaction.guildId);

        const commands = [];

        for await (const file of fs.readdirSync("./discord/personbot/application/")) {
            let command = await import(`../application/${file}`);
            if (interaction.guild.members.me.permissions.has(command.requires) && file != "update.js") commands.push(command.data.toJSON());
        };

        const rest = new REST({ version: "10" }).setToken(process.env.PERSONBOT_TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(process.env.PERSONBOT_ID, interaction.guildId), { body: commands },
        );

        var commandNames = [];
        commands.forEach(x => commandNames.push(x.name));

        return await interaction.editReply(`**Slash commands updated!**\nCommands are:\n${commandNames.join("\n")}`);
    } catch (rejRes) {
        return await interaction.editReply(`You're being ratelimited! Try again in *${Math.round(rejRes.msBeforeNext / 1000)}* seconds.`);
    }
}