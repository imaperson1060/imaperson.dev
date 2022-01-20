import express from "express";
import http from "http";
const app = express();
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

io.on("connection", async (socket) => (await import("./socket/socket.js")).default(io, socket));

app.set("json spaces", 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
fs.readdirSync("./discord").forEach(async x => (await import(`./discord/${x}/bot.js`)).default());


app.get("/short/go/:domain/:id", async (req, res) => (await import("./socket/short/go.js")).default(req, res));
app.get("/yt/watch/:id", async (req, res) => (await import("./socket/yt/watch.js")).default(req, res));
app.get("/teapot/", (req, res) => res.sendStatus(418));


server.listen(process.env.PORT, async () => {
    console.log(`API Ready! (${process.env.PORT})`);

    (await import("./uptimerobot.js")).default(app);
});