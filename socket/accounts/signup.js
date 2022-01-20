import md5 from "md5";
import mysql from "mysql";
import nodemailer from "nodemailer";
import { RateLimiterMemory } from "rate-limiter-flexible";
import util from "util";

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "accounts" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

async function mail(to, subject, html) {
    const mailLogin = JSON.parse(process.env.MAIL);

    const mailer = nodemailer.createTransport({
        host: mailLogin.host,
        port: mailLogin.port,
        auth: {
            user: mailLogin.auth.user,
            pass: mailLogin.auth.pass,
        }
    });
    let info = await mailer.sendMail({
        from: "Ari Meisels <me@arimeisels.com>",
        to: to,
        subject: subject,
        html: html
    });
}

const rateLimiter = new RateLimiterMemory({ points: 1, duration: 60 });

export default async (io, socket, args) => {
    try {
        if (!args[0] || !args[0].name || !args[0].email || !args[0].username || !args[0].password) return socket.emit("accounts-signup", { success: false, message: "invalidargs", args });

        if (args[0].username.length > 32) return socket.emit("accounts-creation", { success: false, message: "long", args });
        if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(args[0].email.toLowerCase())) return socket.emit("accounts-signup", { success: false, message: "invalidemail", args });

        function capitalize(str) {
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        
        if ((await query("SELECT * FROM `users` WHERE username=?", [args[0].username]))[0]) return socket.emit("accounts-signup", { success: false, message: "taken", args });
        if ((await query("SELECT * FROM `users` WHERE email=?", [args[0].email]))[0]) return socket.emit("accounts-signup", { success: false, message: "emailused", args });

        var timestamp = Math.round(new Date().getTime() / 1000);

        await rateLimiter.consume(socket.handshake.address);

        await mail(args[0].email, "Welcome", `<h1>Hey, ${capitalize(args[0].name)}! Thanks for creating an account on my website!</h1> <h2>If you have any questions, feel free to <a href="mailto:me@arimeisels.com">shoot me an email</a>!</h3> <style>* { font-family: sans-serif }</style>`);

        await query("ALTER TABLE `users` AUTO_INCREMENT=?", [(await query("SELECT MAX(`id`) AS max FROM `users`"))[0].max]);
        await query("INSERT INTO `users`(`username`, `name`, `email`, `password`) VALUES (?,?,?,?)", [args[0].username, capitalize(args[0].name), args[0].email, md5(args[0].password)]);

        socket.emit("accounts-signup", { success: true, args });
    } catch (rejRes) {
        socket.emit("accounts-signup", { success: false, message: "ratelimit", reset: rejRes.msBeforeNext, args });
    }
}