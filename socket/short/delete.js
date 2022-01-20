import md5 from "md5";
import mysql from "mysql";
import util from "util";

var mysqlAccountLogin = JSON.parse(process.env.MYSQL);
mysqlAccountLogin = Object.assign(mysqlAccountLogin, { database: "accounts" });
var accountDatabase = mysql.createPool(mysqlAccountLogin);
var accountQuery = util.promisify(accountDatabase.query).bind(accountDatabase);

var mysqlShortLogin = JSON.parse(process.env.MYSQL);
mysqlShortLogin = Object.assign(mysqlShortLogin, { database: "short" });
var shortDatabase = mysql.createPool(mysqlShortLogin);
var shortQuery = util.promisify(shortDatabase.query).bind(shortDatabase);

async function deleteExpired() {
    const expired = await shortQuery("SELECT * from `urls` WHERE expiration<?", [Math.round(new Date().getTime() / 1000)]);
    expired.forEach(async (x) => {
        await shortQuery("DELETE FROM `urls` WHERE id=?", [x.id]);
    });
}

export default async (io, socket, args) => {
    if (!args[0] || !args[0].id | !args[0].creator || !args[0].password) return socket.emit("short-delete-success", { success: false, message: "invalidargs" });

    deleteExpired();

    const result = (await shortQuery("SELECT * FROM `urls` WHERE name=?", [args[0].id]))[0];
    if (result) {
        const account = (await accountQuery("SELECT * FROM `users` WHERE creator=?", [args[0].creator]))[0];
        if (account) {
            if (account.password == md5(args[0].password)) {
                await shortQuery("DELETE FROM `urls` WHERE name=?", [args[0].id]);
                
                socket.emit("short-delete-success", { success: true, message: `The id "${result.name}" has been deleted.`, args });
            } else {
                socket.emit("short-delete-success", { success: false, message: `The password is incorrect.`, args });
            }
        } else {
            socket.emit("short-delete-success", { success: false, message: `Account "${args[0].creator}" does not exist.`, args });
        }
    } else {
        socket.emit("short-delete-success", { success: false, message: `The id "${args[0].id}" does not exist.`, args });
    }
}