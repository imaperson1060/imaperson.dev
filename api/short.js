import moment from "moment";
import mysql from "mysql";
import util from "util";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "short" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

export default async (req, res) => {
	(await query("SELECT * from `urls` WHERE `expiration`<?", [ moment().unix() ]))
		.forEach(async url => await query("DELETE FROM `urls` WHERE `name`=?", [ url.name ]));
	switch (req.method) {
		case "GET":
			if (!req.query.id || !req.query.ext) {
				if (req.query.go) return res.redirect("/short");
				else return res.status(400).json({ success: false, code: 400, error: "no id or domain provided", args: req.query })
			}
			let result = (await query("SELECT * FROM `urls` WHERE `name`=? AND `domain`=?", [ req.query.id, req.query.ext ]))[0];
			if (req.query.go) return res.redirect(result ? decodeURIComponent(result.longurl) : "/404");
			else if (!result) return res.status(404).json({ success: false, code: 404, error: "id not found in database", args: req.query });
			else return res.status(200).json({ success: true, code: 200, id: req.query.id, longurl: result.longurl, domain: result.domain, expiration: result.expiration, args: req.query });
		case "POST":
			if (!req.body.url || !req.body.expiration || (req.body.expiration - 600) < moment.unix() || !req.body.domain || ([ "tk", "cf", "gq" ].indexOf(req.body.domain) == -1)) return res.status(400).json({ success: false, code: 400, error: "invalid request", args: req.body });
			if (req.body.custom) {
				let shortURL = (await query("SELECT * FROM `urls` WHERE `name`=?", [ req.body.custom ]))[0];
				if (shortURL && !req.body.edit) return res.status(409).json({ success: false, code: 409, error: "id already exists, edit key is required" });
				else if (shortURL && req.body.domain != shortURL.domain) return res.status(409).json({ success: false, code: 409, error: "domain cannot be changed" });
				else if (shortURL && req.body.edit != shortURL.editkey) return res.status(409).json({ success: false, code: 409, error: "edit key is incorrect" });
				let editkey = shortURL?.editkey;
				if (shortURL) await query("UPDATE `urls` SET `longurl`=?, `expiration`=? WHERE `name`=?", [ req.body.url, req.body.expiration, req.body.custom ]);
				else {
					editkey = Math.random().toString(36).slice(-10);
					await query("INSERT INTO `urls`(`name`, `editkey`, `longurl`, `domain`, `expiration`) VALUES (?,?,?,?,?)", [ req.body.custom, editkey, req.body.url, req.body.domain, req.body.expiration ]);
				}
				return res.status(200).json({ success: true, id: req.body.custom, editkey, longurl: req.body.url, domain: req.body.domain, expiration: req.body.expiration, args: req.body });
			} else {
				while (true) {
					let id = Math.random().toString(36).slice(-5);
					if ((await query("SELECT * FROM `urls` WHERE `name`=?", [ id ]))[0]) continue;
					let editkey = Math.random().toString(36).slice(-10);
					await query("INSERT INTO `urls`(`name`, `editkey`, `longurl`, `domain`, `expiration`) VALUES (?,?,?,?,?)", [ id, editkey, req.body.url, req.body.domain, req.body.expiration ]);
					return res.status(200).json({ success: true, code: 200, id, editkey, longurl: req.body.url, domain: req.body.domain, expiration: req.body.expiration, args: req.body });
				}
			}
		default: return res.status(405).json({ success: false, code: 405, error: "method not allowed", args: req.body });
	}
}