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
    if (!args[0] || !args[0].email) return socket.emit("accounts-forgot", { success: false, message: "invalidargs", args });

    const info = (await query("SELECT * FROM `users` WHERE email=?", [args[0].email]))[0];

    if (!info) return socket.emit("accounts-forgot", { success: false, message: "invalidemail", args });

    await mail(info.email, "Reset Password", `<h1>Hi, ${info.name}!</h1> <h2>Click <a href="https://imaperson.dev/reset.html?u=${info.username}&c=${md5(info.username + info.password)}">here</a> to reset your password!</h2> <h3>If you did not request to have your password reset, please ignore this email.</h3> <style>* { font-family: sans-serif }</style>`);

    socket.emit("accounts-forgot", { "success": true, args });
}