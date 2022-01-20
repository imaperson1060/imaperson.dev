import mysql from "mysql";
import util from "util";

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "short" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

async function deleteExpired() {
    const expired = await query("SELECT * from `urls` WHERE expiration<?", [Math.round(new Date().getTime() / 1000)]);
    expired.forEach(async (x) => {
        await query("DELETE FROM `urls` WHERE id=?", [x.id]);
    });
}

export default async (req, res) => {
    if (!req.params.domain || !req.params.id) return res.redirect("/short/");

    deleteExpired();

    if ((await query("SELECT * FROM `urls` WHERE name=?", [req.params.id]))[0]) {
        const result = (await query("SELECT * FROM `urls` WHERE name=? AND domain=?", [req.params.id, req.params.domain]))[0];
        res.redirect(result ? result.longurl : "/short/");
    } else {
        res.redirect("/short/");
    }
}