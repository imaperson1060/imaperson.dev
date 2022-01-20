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

export default async (io, socket, args) => {
    if (!args[0] || !args[0].id) return socket.emit("short-get-success", { success: false, message: "invalidargs", args });

    deleteExpired();

    const result = (await query("SELECT * FROM `urls` WHERE name=?", [args[0].id]))[0];
    socket.emit("short-get-success", { success: result, message: (result ? result.longurl : `The id "${args[0].id}" does not exist.`, args) });
}