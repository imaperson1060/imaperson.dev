import moment from "moment";
import mysql from "mysql";
import util from "util";

import * as components from "../components/shorten.js";

let mysqlLogin = Object.assign(JSON.parse(process.env.MYSQL), { database: "short" }),
	database = mysql.createPool(mysqlLogin),
	query = util.promisify(database.query).bind(database);

export default async function (client, interaction, options) {
	await interaction.deferReply({ ephemeral: true });

	(await query("SELECT * from `urls` WHERE `expiration`<?", [ moment().unix() ]))
		.forEach(async url => await query("DELETE FROM `urls` WHERE `name`=?", [ url.name ]));

	let url = options.find(x => x.name == "url").value,
		domain = options.find(x => x.name == "domain").value,
		expiration = { "12h": moment().add(12, "h").unix(), "1d": moment().add(1, "d").unix(), "1w": moment().add(1, "w").unix(), "1m": moment().add(1, "M").unix(), "6m": moment().add(6, "M").unix(), "1y": moment().add(1, "y").unix(), "max": 2147483647 }[options.find(x => x.name == "expiration").value],
		id = options.find(x => x.name == "id")?.value,
		editkey = options.find(x => x.name == "editkey")?.value;
	if (!/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,63}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(url)) return await interaction.editReply("a valid url must be supplied");
	if (url.indexOf("http:\/\/") == -1 && url.indexOf("https:\/\/") == -1) url = "http://" + url;

	if (id) {
		let shortURL = (await query("SELECT * FROM `urls` WHERE `name`=?", [ id ]))[0];
		if (shortURL && !editkey) return await interaction.editReply("id already exists, edit key is required");
		else if (shortURL && domain != shortURL.domain) return await interaction.editReply("domain cannot be changed");
		else if (shortURL && editkey != shortURL.editkey) return await interaction.editReply("edit key is incorrect");
		else if (id.length > 16) return await interaction.editReply("id is too long");
		if (shortURL) await query("UPDATE `urls` SET `longurl`=?, `expiration`=? WHERE `name`=?", [ url, expiration, id ]);
		else {
			editkey = Math.random().toString(36).slice(-10);
			await query("INSERT INTO `urls`(`name`, `editkey`, `longurl`, `domain`, `expiration`) VALUES (?,?,?,?,?)", [ id, editkey, url, domain, expiration ]);
		}
		return await interaction.editReply({ embeds: [ components.shortURLEmbed(client, domain, id, editkey, expiration) ] });
	} else {
		while (true) {
			let id = Math.random().toString(36).slice(-5);
			if ((await query("SELECT * FROM `urls` WHERE `name`=?", [ id ]))[0]) continue;
			editkey = Math.random().toString(36).slice(-10);
			await query("INSERT INTO `urls`(`name`, `editkey`, `longurl`, `domain`, `expiration`) VALUES (?,?,?,?,?)", [ id, editkey, url, domain, expiration ]);
			return await interaction.editReply({ embeds: [ components.shortURLEmbed(client, domain, id, editkey, expiration) ] });
		}
	}
}