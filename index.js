import express from "express";
const app = express();

import cors from "cors";
import fs from "fs";
import isReachable from "is-reachable";
import md5 from "md5";
import mysql from "mysql";
import nodemailer from "nodemailer";
import ratelimit from "express-rate-limit";
import sha1 from "sha1";
import urlexists from "url-exists";
import util from "util";

import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";
const ytSuite = { dl: ytdl, pl: ytpl, sr: ytsr };

app.set("json spaces", 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

import dotenv from "dotenv";
dotenv.config();

const mysqlLogin = JSON.parse(process.env.MYSQL);
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

var urlExists = util.promisify(urlexists).bind(urlexists);

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

import accounts from "./accounts.js";
import github from "./github.js";
import short from "./short.js";
import uptimerobot from "./uptimerobot.js";
import yt from "./yt.js";

accounts(app, cors, mail, md5, query, ratelimit);
github(app, cors, fetch, sha1);
short(app, cors, isReachable, md5, query, ratelimit, urlExists);
yt(app, cors, query, urlExists, ytSuite);

fs.readdirSync("./discord").forEach(async x => (await import(`./discord/${x}/bot.js`)).default());


app.get("/teapot/", cors(), (req, res) => {
    res.sendStatus(418);
});


app.listen(process.env.PORT, async () => {
    console.log(`API Ready! (${process.env.PORT})`);

    uptimerobot(app, fetch);
});