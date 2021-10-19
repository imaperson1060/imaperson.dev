const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const archiver = require("archiver");
const cors = require("cors");
const crypto = require("crypto");
const fetch = require("node-fetch");
const imageToBase64 = require("image-to-base64");
const isReachable = require("is-reachable");
const jsonSchema = require("jsonschema");
const md5 = require("md5");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const urlexists = require("url-exists");
const util = require("util");
const yt = { dl: require("ytdl-core"), pl: require("ytpl"), sr: require("ytsr") };

app.set("json spaces", 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

require("dotenv").config();

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


require("./accounts.js")(app, cors, mail, md5, query, rateLimit);
require("./count.js")(app, query);
require("./github.js")(app, cors, fetch);
require("./short.js")(app, cors, isReachable, md5, query, rateLimit, urlExists);
require("./yt.js")(app, cors, fetch, imageToBase64, query, urlExists, yt.dl);
//require("./yt.js")(app, archiver, cors, fetch, imageToBase64, query, urlExists, util, yt);

require("fs").readdirSync("./discord").forEach(x => require(`./discord/${x}/bot.js`));


app.get("/up/", cors(), (req, res) => {
    res.json({ "success": true });
});

app.post("/restart/", (req, res) => {
    const expectedSignature = "sha1=" +
        crypto.createHmac("sha1", process.env.PASSWORD)
            .update(JSON.stringify(req.body))
            .digest("hex");

    const signature = req.headers["x-hub-signature"];
    if (signature == expectedSignature) {
        res.sendStatus(200);
        process.exit();
    }
});


server.listen(process.env.PORT, () => {
    console.log(`API Ready! (${process.env.PORT})`);
});