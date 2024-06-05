import chalk from "chalk";
import fs from "fs";
import moment from "moment";

import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();

console.log(moment().format(), chalk.yellow("---------------------------------"));
console.log(moment().format(), chalk.yellow("initializing express server..."));
console.log(moment().format(), chalk.yellow("---------------------------------"));

app.set("json spaces", 4);
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

console.log(moment().format(), "loading routes...");
let routes = fs.readdirSync("./api");
console.log(moment().format(), `found ${routes.length} routes...`);
routes.forEach(route => {
	app.all(
		`/api/${route.split(".")[0]}`,
		((filename, req, res) => {
			console.log(moment().format(), chalk.blue(req.method), chalk.magenta(req.originalUrl));
			import(`./api/${filename}?cachebuster=${Date.now()}`)
				.then(module => module.default(req, res))
				.catch(err => console.error(moment().format(), chalk.red(`error in route ${filename.split(".")[0]}:\n\t${err}`)));
		}).bind(null, route)
	);
	console.log(moment().format(), chalk.green("registered", chalk.magenta(`"/api/${route.split(".")[0]}"`), "route"));
});

app.listen(process.env.PORT, async () => {
	console.log(moment().format(), chalk.green("api ready"), chalk.blue(`(listening on port ${process.env.PORT})`));
	(await import("./api/stop.js")).changeStatus("1");
	fs.readdirSync("./discord").forEach(async bot => (await import(`./discord/${bot}/bot.js`)).default());
});