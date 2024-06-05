import chalk from "chalk";
import moment from "moment";

export default async function (client) {
	client.user.setActivity("being a person.");
	console.log(moment().format(), chalk.green("discord bot"), chalk.blue(client.user.username), chalk.green("ready"));
}