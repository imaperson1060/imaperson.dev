exports.run = async (client, interaction, options) => {
    function findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }

    const mysqlLogin = JSON.parse(process.env.MYSQL);
    var database = require("mysql").createPool(mysqlLogin);
    var query = require("util").promisify(database.query).bind(database);

    const isReachable = require("is-reachable");


    await interaction.deferReply({ ephemeral: false });

    var url = ((findObjectByKey(options, "name", "url").value.startsWith("http://") ? findObjectByKey(options, "name", "url").value.slice(7) : (findObjectByKey(options, "name", "url").value.startsWith("https://") ? findObjectByKey(options, "name", "url").value.slice(8) : findObjectByKey(options, "name", "url").value)));
    var expiration = findObjectByKey(options, "name", "expiration").value;
    var id = (findObjectByKey(options, "name", "id") ? findObjectByKey(options, "name", "id").value : undefined);
    var domain = findObjectByKey(options, "name", "domain").value;
    var expirations = {
        "12h": 43200,
        "1d": 86400,
        "1w": 604800,
        "1m": 2419200,
        "6m": 14515200,
        "1y": 31536000,
        "∞": 2147483647
    }
        
    var https = await isReachable(`https://${decodeURIComponent(url)}`);
    var http = await isReachable(`http://${decodeURIComponent(url)}`);

    if (!https && !http) {
        return await interaction.editReply("That website kinda doesn't exist, or it cannot be detected by me. Sorry!");
    }

    if (id) {
        if ((await query("SELECT * FROM `short` WHERE `id`=?", [id]))[0]) {
            await interaction.editReply("That ID is already in use!");
            return;
        } else {
            await query("INSERT INTO `short` (`id`, `longurl`, `domain`, `username`, `expiration`) VALUES (?, ?, ?, ?, ?)", [id, (https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`), domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);
            await interaction.editReply(`Shortened to https://ariurls.${domain}/${id} !`);
            return;
        }
    } else {
        var characters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];

        (async function generateURL() {
            var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];
                
            if (await query("SELECT * FROM `short` WHERE `id`=?", [randomString])[0]) {
                generateURL();
            } else {
                await query("INSERT INTO `short` (`id`, `longurl`, `domain`, `username`, `expiration`) VALUES (?, ?, ?, ?, ?)", [randomString, (https ? `https://${decodeURIComponent(url)}` : `http://${decodeURIComponent(url)}`), domain, "Guest", Math.round(new Date().getTime() / 1000) + expirations[expiration]]);
                await interaction.editReply(`Shortened to https://ariurls.${domain}/${randomString} !`);
                return;
            }
        })();
    }
}