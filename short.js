module.exports = (app, cors, isReachable, md5, query, rateLimit, urlExists) => {
    const shortenLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5, // limit each IP to 1 request per windowMs
        message: { "success": false, "message": "Only 5 URLs can be shortened per minute." }
    });

    app.get("/short/:id", cors(), async (req, res) => {
        const result = (await query("SELECT * FROM `short` WHERE id=?", [req.params.id]))[0];
        if (result) {
            res.json({ success: true, url: result.longurl });
        } else {
            res.json({ success: false, message: `The id "${req.params.id}" does not exist.` });
        }
    });

    app.get("/short/go/:url", cors(), (req, res) => {
        res.redirect("/short/");
    });

    app.get("/short/go/:url/:id/", cors(), async (req, res) => {
        const result = (await query("SELECT * FROM `short` WHERE id=?", [req.params.id]))[0];
        if (result) {
            if (result.expiration < Math.round(new Date().getTime() / 1000)) {
                await query("DELETE FROM `short` WHERE id=?", [req.params.id]);

                res.redirect("/short/");
            } else {
                const result = (await query("SELECT * FROM `short` WHERE id=? AND domain=?", [req.params.id, req.params.domain]))[0];
                res.redirect(result ? result[0].longurl : "/short/");
            }
        } else {
            res.redirect("/short/");
        }
    });

    app.get("/short/delete/:id/:creator/:password", async (req, res) => {
        const result = (await query("SELECT * FROM `short` WHERE id=?", [req.params.id]))[0];
        if (result) {
            const account = (await query("SELECT * FROm `accounts` WHERE username=?", [req.params.creator]))[0];
            if (account) {
                if (account.password == md5(req.params.password)) {
                    await query("DELETE FROM `short` WHERE id=", [req.params.id]);
                    
                    res.json({ success: true, message: `id "${result[0].id}" has been deleted.` });
                } else {
                    res.json({ success: false, message: `The password is incorrect.` });
                }
            } else {
                res.json({ success: false, message: `Account "${req.params.creator}" does not exist.` });
            }
        } else {
            res.json({ success: false, message: `The id "${req.params.id}" does not exist.` });
        }
    });

    app.get("/short/:url/:customid?/:domain/:username/:expires/", shortenLimiter, async (req, res) => {
        var url = decodeURIComponent(req.params.url);
        url = ((await isReachable(`https://${url}`)) ? `https://${url}` : `http://${url}`);

        if (await urlExists(url)) {
            if (req.params.customid) {
                const result = (await query("SELECT * FROM `short` WHERE id=?", [req.params.customid]))[0];
                if (result) {
                    res.json({ success: false, message: `The id "${req.params.customid}" was already taken.` });
                } else {
                    await query("INSERT INTO `short` VALUES (?,?,?,?,?)", [req.params.customid, url, req.params.domain, req.params.username, req.params.expires]);

                    res.json({ success: true, message: req.params.customid });
                }
            } else {
                var characters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];

                (async function generateURL () {
                    var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];

                    if ((await query("SELECT * FROM `short` WHERE id=?", [randomString]))[0]) return generateURL();

                    await query("INSERT INTO `short` VALUES (?,?,?,?,?)", [randomString, url, req.params.domain, req.params.username, req.params.expires]);

                    res.json({ success: true, message: randomString });
                })();
            }
        } else {
            res.json({ success: false, message: "Invalid URL" });
        }
    });

    app.get("/short/check/:url/", async (req, res) => {
        var https = await isReachable(`https://${decodeURIComponent(req.params.url)}`);
        var http = await isReachable(`http://${decodeURIComponent(req.params.url)}`);
        res.json({ "https": https, "http": http });
    });
}