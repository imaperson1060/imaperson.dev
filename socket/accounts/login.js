import md5 from "md5";
import mysql from "mysql";
import util from "util";

var mysqlLogin = JSON.parse(process.env.MYSQL);
mysqlLogin = Object.assign(mysqlLogin, { database: "accounts" });
var database = mysql.createPool(mysqlLogin);
var query = util.promisify(database.query).bind(database);

export default async (io, socket, args) => {
    if (!args[0] || !args[0].username || !args[0].password) return socket.emit("accounts-login", { success: false, message: "invalidargs", args });

    const info = (await query("SELECT * FROM `users` WHERE username=?", [args[0].username]))[0];

    if (!info) return socket.emit("accounts-login", { success: false, message: "noaccount", args });

    if ((args[0].password == info.password) || (md5(args[0].password) == info.password)) {
        socket.emit("accounts-login", { success: true, args });
    } else {
        socket.emit("accounts-login", { success: false, message: "wrongpass", args });
    }
}