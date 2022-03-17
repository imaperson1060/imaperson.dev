import moment from "moment";
import mysql from "mysql";
import fetch from "node-fetch";
import { RateLimiterMemory } from "rate-limiter-flexible";
import util from "util";

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "github" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

const rateLimiter = new RateLimiterMemory({ points: 1, duration: 300 });

export default async (io, socket, args) => {
    try {
        //await rateLimiter.consume(socket.handshake.address);
        
        if (args[0] && ((args[0].since && !args[0].until) || (!args[0].since && args[0].until) || !moment(args[0].since).isValid() || !moment(args[0].until).isValid())) return socket.emit("github-commits", { success: false, message: "invalidargs", args });

        var since = args[0] ? moment(args[0].since).toISOString() : moment().subtract(7, "d").toISOString();
        var until = args[0] ? moment(args[0].until).add(1, "d").toISOString() : moment();

        var commits = await fetch(`https://api.github.com/repos/imaperson1060/imaperson.dev/commits?per_page=100&since=${since}&until=${until}`, {
            headers: {
                Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}`
            }
        });

        commits = await commits.json();

        for await (const x of commits) {
            if (!(await query("SELECT * FROM `commits` WHERE id=?", [ x.sha ]))[0]) {
                x.stats = (await (await fetch(`https://api.github.com/repos/imaperson1060/imaperson.dev/commits/${x.sha}`, {
                    headers: {
                        Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}`
                    }   
                })).json()).stats;

                await query("INSERT INTO `commits`(`id`, `name`, `author`, `stats`, `date`) VALUES (?,?,?,?,?)", [ x.sha, encodeURIComponent(x.commit.message), encodeURIComponent(x.commit.author.name), JSON.stringify(x.stats), x.commit.author.date ]);
            } else {
                x.stats = JSON.parse((await query("SELECT * FROM `commits` WHERE id=?", [ x.sha ]))[0].stats);
            }
        }

        socket.emit("github-commits", { success: true, commits, args });
    } catch (rejRes) {
        socket.emit("github-commits", { success: false, message: "ratelimit", reset: Math.round(rejRes.msBeforeNext / 1000), args });
    }
}