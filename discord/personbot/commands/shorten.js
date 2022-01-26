import fetch from "node-fetch";
import mysql from "mysql";
import { RateLimiterMemory } from "rate-limiter-flexible";
import util from "util";

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "short" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

async function deleteExpired() {
    const expired = await query("SELECT * from `urls` WHERE expiration<?", [Math.round(new Date().getTime() / 1000)]);
    expired.forEach(async (x) => {
        await query("DELETE FROM `urls` WHERE id=?", [x.id]);
    });
}

const rateLimiter = new RateLimiterMemory({ points: 1, duration: 60 });

export default async function (client, interaction, options) {
    await interaction.deferReply({ ephemeral: false });

    deleteExpired();

    try {
        await rateLimiter.consume(interaction.user.id);

        var url = ((options.find(x => x.name == "url").value.startsWith("http://") ? options.find(x => x.name == "url").value.slice(7) : (options.find(x => x.name == "url").value.startsWith("https://") ? options.find(x => x.name == "url").value.slice(8) : options.find(x => x.name == "url").value)));
        var expiration = options.find(x => x.name == "expiration").value;
        var id = (options.find(x => x.name == "id") ? options.find(x => x.name == "id").value : undefined);
        var domain = options.find(x => x.name == "domain").value;
        var expirations = {
            "12h": 43200,
            "1d": 86400,
            "1w": 604800,
            "1m": 2419200,
            "6m": 14515200,
            "1y": 31536000,
            "∞": 2147483647
        }
            
        const urls = await (await fetch("https://bot.arimeisels.com/url", { method: "POST", body: decodeURIComponent(url) })).json();

        if (!urls.https && !urls.http) {
            return await interaction.editReply("That website kinda doesn't exist, or it cannot be detected by me. Sorry!");
        }

        if (id) {
            const result = (await query("SELECT * FROM `urls` WHERE name=?", [id]))[0];
            if (result) {
                await interaction.editReply("That ID is already in use!");
                return;
            } else {
                await query("ALTER TABLE `urls` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `urls`"))[0].max]);
                await query("INSERT INTO `urls`(`name`, `longurl`, `domain`, `creator`, `expiration`) VALUES (?,?,?,?,?)", [id, urls.https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`, domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);

                return await interaction.editReply(`Shortened to https://ariurls.${domain}/${id} !`);
            }
        } else {
            var characters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

            (async function generateURL() {
                var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];

                if ((await query("SELECT * FROM `urls` WHERE name=?", [randomString]))[0]) return generateURL();

                await query("ALTER TABLE `urls` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `urls`"))[0].max]);
                await query("INSERT INTO `urls`(`name`, `longurl`, `domain`, `creator`, `expiration`) VALUES (?,?,?,?,?)", [randomString, urls.https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`, domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);

                return await interaction.editReply(`Shortened to https://ariurls.${domain}/${randomString} !`);
            })();
        }
    } catch (rejRes) {
        return await interaction.editReply(`You're being ratelimited! Try again in *${Math.round(rejRes.msBeforeNext / 1000)}* seconds.`);
    }
}