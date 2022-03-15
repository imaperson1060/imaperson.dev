import md5 from "md5";
import mysql from "mysql";
import nodemailer from "nodemailer";
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
        from: "Ari Meisels <me@imaperson.dev>",
        to: to,
        subject: subject,
        html: html
    });
}

export default async (io, socket, args) => {
    if (!args[0] || !args[0].username || !args[0].code) return socket.emit("accounts-reset", { success: false, message: "invalidargs", args });

    const info = (await query("SELECT * FROM `users` WHERE username=?", [args[0].username]))[0];

    if (!info) return socket.emit("accounts-reset", { success: false, message: "noaccount", args });
    
    if (args[0].code == md5(info.username + info.password)) {
        const newPassword = md5(Math.floor(Date.now() / 1000) + info.password);

        await mail(info.email, "Password Reset", `<h1>Hi, ${info.name}!</h1> <h2>Your password was just reset to "${newPassword}" about a minute ago. Just thought you should know in case it wasn't you!</h2> <style>* { font-family: sans-serif }</style>`);

        await query("UPDATE `users` SET password=? WHERE username=?", [md5(newPassword), args[0].username]);

        socket.emit("accounts-reset", { success: true, message: newPassword, args });
    } else {
        socket.emit("accounts-reset", { success: false, message: "wrongcode", args });
    }
}