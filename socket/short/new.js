import isReachable from "is-reachable";
import mysql from "mysql";
import { RateLimiterMemory } from "rate-limiter-flexible";
import urlexists from "url-exists";
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

const rateLimiter = new RateLimiterMemory({ points: 5, duration: 60 });

var urlExists = util.promisify(urlexists).bind(urlexists);

export default async (io, socket, args) => {
    try {
        await rateLimiter.consume(socket.handshake.address);

        if (!args[0] || !args[0].url || !args[0].domain || (["tk", "ml", "ga", "cf", "gq"].indexOf(args[0].domain) == -1) || !args[0].expires || isNaN(args[0].expires) || (args[0].expires > 2147483647) || ((args[0].expires - 600) < Math.round(new Date().getTime() / 1000))) return socket.emit("short-new", { success: false, message: "invalidargs", args });

        deleteExpired();

        var url = decodeURIComponent(args[0].url);
        url = ((await isReachable(`https://${url}`)) ? `https://${url}` : `http://${url}`);

        if (await urlExists(url)) {
            if (args[0].customid) {
                const result = (await query("SELECT * FROM `urls` WHERE name=?", [args[0].customid]))[0];
                if (result) {
                    socket.emit("short-new", { success: false, message: "idtaken", args });
                } else {
                    await query("ALTER TABLE `urls` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `urls`"))[0].max]);
                    await query("INSERT INTO `urls`(`name`, `longurl`, `domain`, `creator`, `expiration`) VALUES (?,?,?,?,?)", [args[0].customid, url, args[0].domain, args[0].creator || "Guest", args[0].expires]);

                    socket.emit("short-new", { success: true, message: args[0].customid, args });
                }
            } else {
                var characters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

                (async function generateURL() {
                    var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];

                    if ((await query("SELECT * FROM `urls` WHERE name=?", [randomString]))[0]) return generateURL();

                    await query("ALTER TABLE `urls` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `urls`"))[0].max]);
                    await query("INSERT INTO `urls`(`name`, `longurl`, `domain`, `creator`, `expiration`) VALUES (?,?,?,?,?)", [randomString, url, args[0].domain, args[0].creator || "Guest", args[0].expires]);

                    socket.emit("short-new", { success: true, message: randomString, args });
                })();
            }
        } else {
            socket.emit("short-new", { success: false, message: "invalidurl", args });
        }
    } catch (rejRes) {
        console.log(rejRes)
        socket.emit("short-new", { success: false, message: "ratelimit", reset: Math.round(rejRes.msBeforeNext / 1000), args });
    }
}