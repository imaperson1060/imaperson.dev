import moment from "moment";
import mysql from "mysql";
import util from "util";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "github" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

export default async (req, res) => {
	switch (req.method) {
		case "GET":
			if ((req.query.since && !req.query.until) || (!req.query.since && req.query.until) || !moment(req.query.since).isValid() || !moment(req.query.until).isValid()) return res.status(400).json({ success: false, code: 400, error: "invalid date range", args: req.query });
			let since = req.query.since ? moment(req.query.since).toISOString() : moment().subtract(7, "d").toISOString(),
				until = req.query.until ? moment(req.query.until).add(1, "d").toISOString() : moment(),
				commits = await (await fetch(`https://api.github.com/repos/imaperson1060/imaperson.dev/commits?per_page=100&since=${since}&until=${until}`, { headers: { Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}` } })).json();
			for await (const commit of commits) {
				if (!(await query("SELECT * FROM `commits` WHERE id=?", [ commit.sha ]))[0]) {
					commit.stats = (await (await fetch(`https://api.github.com/repos/imaperson1060/imaperson.dev/commits/${commit.sha}`, { headers: { Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}` } })).json()).stats;
					await query("INSERT INTO `commits`(`id`, `name`, `author`, `stats`, `date`) VALUES (?,?,?,?,?)", [ commit.sha, encodeURIComponent(commit.commit.message), encodeURIComponent(commit.commit.author.name), JSON.stringify(commit.stats), commit.commit.author.date ]);
				} else commit.stats = JSON.parse((await query("SELECT * FROM `commits` WHERE id=?", [ commit.sha ]))[0].stats);
			}
			return res.status(200).json({ success: true, code: 200, commits, args: req.query });
		default: return res.status(405).json({ success: false, code: 405, error: "method not allowed", args: req.query });
	}
}