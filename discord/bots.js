module.exports = (query) => {
    require("./personbot/personbot.js")(query);
    require("./shortcutter/bot.js");
}