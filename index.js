const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const cors = require("cors");
const fetch = require("node-fetch");
const request = require("request");
const imageToBase64 = require("image-to-base64");
const isReachable = require("is-reachable");
const jsonSchema = require("jsonschema");
const md5 = require("md5");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const url = require("url");
const util = require("util");
const urlExists = require("url-exists");
const ytdl = require("ytdl-core");

app.set("json spaces", 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


require("dotenv").config();

const mysqlLogin = JSON.parse(process.env.MYSQL);
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

app.use(express.static("static"));


require("./accounts.js")(app, cors, database, mail, md5, rateLimit);
require("./discord/bots.js")(query);
require("./short.js")(app, cors, database, isReachable, md5, rateLimit, urlExists);
require("./tictactoe.js")(app, cors, database);
require("./yt.js")(app, cors, database, imageToBase64, request, urlExists, ytdl);
require("./5b.js")(app, cors, database, jsonSchema, md5);
require("./socket.js")(io);


app.get("/up/", cors(), (req, res) => {
    res.json({ "success": true });
});


app.get("/troll/", cors(), (req, res) => {
    app.set("json spaces", 0);
    res.json([{ "enabled": Math.round(Math.random() * 100) != 1 }]);
    app.set("json spaces", 4);

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
});

app.post("/restart/", (req, res) => {
    console.log(req)
});

server.listen(process.env.PORT, () => {
    console.log("API Ready!");
});