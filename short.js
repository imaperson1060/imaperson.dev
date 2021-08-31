module.exports = (app, cors, database, isReachable, md5, rateLimit, urlExists) => {
    const shortenLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5, // limit each IP to 1 request per windowMs
        message: { "success": false, "message": "Only 5 URLs can be shortened per minute." }
    });

    app.get("/short/:id", cors(), (req, res) => {
        database.query(`SELECT * FROM \`short\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result[0]) {
                res.json({ "success": true, "url": result[0].longurl });
            } else {
                res.statusCode = 404;

                res.json({ "success": false, "message": `The id "${req.params.id}" does not exist.` });
            }
        });
    });

    app.get("/short/go/:url/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`short\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result[0]) {
                if (result[0].expiration < Math.round(new Date().getTime() / 1000)) {
                    database.query(`DELETE FROM \`short\` WHERE id="${req.params.id}"`);

                    res.redirect("/short/");
                } else {
                    database.query(`SELECT * FROM \`short\` WHERE id="${req.params.id}" AND domain="${req.params.url}"`, function (error, result, fields) {
                        if (result[0]) {
                            res.redirect(result[0].longurl);
                        } else {
                            res.redirect("/short/");
                        }
                    });
                }
            } else {
                res.redirect("/short/");
            }
        });
    });

    app.get("/short/delete/:id/:creator/:password", (req, res) => {
        database.query(`SELECT * FROM \`short\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result[0]) {
                database.query(`SELECT * FROM \`accounts\` WHERE username="${req.params.creator}"`, function (error, result2, fields) {
                    if (result2[0]) {
                        var info = result2[0];
                        
                        if (info.password == md5(req.params.password)) {
                            database.query(`DELETE FROM \`short\` WHERE id="${req.params.id}"`);
                            
                            res.json({ "success": true, "message": `id "${result[0].id}" has been deleted.` });
                        } else {
                            res.json({"success": false, "message": `The password is incorrect.`});
                        }
                    } else {
                        res.json({ "success": false, "message": `Account "${req.params.creator}" does not exist.` });
                    }
                });
            } else {
                res.json({ "success": false, "message": `The id "${req.params.id}" does not exist.` });
            }
        });
    });

    app.get("/short/:url/:customid/:domain/:username/:expires/", shortenLimiter, async (req, res) => {
        var url = decodeURIComponent(req.params.url);
        
        if (await isReachable(`https://${url}`)) {
            url = "https://" + url;
        } else {
            url = "http://" + url;
        }

        urlExists(url, function(err, exists) {
            if (exists) {
                database.query(`SELECT * FROM \`short\` WHERE id="${req.params.customid}"`, function (error, result, fields) {
                    if (result[0]) {
                        res.json({ "success": false, "message": `The id "${req.params.customid}" was already taken.` });
                    } else {
                        database.query(`INSERT INTO \`short\` VALUES ("${req.params.customid}", "${url}", "${req.params.domain}", "${req.params.username}", ${req.params.expires})`);
                        
                        res.json({ "success": true, "message": req.params.customid });
                    }
                });
            } else {
                res.json({"success": false, "message": "Invalid URL"});
            }
        });
    });
    
    app.get("/short/:url/:domain/:username/:expires/", shortenLimiter, async (req, res) => {
        var characters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];
        
        var url = decodeURIComponent(req.params.url);

        if (await isReachable(`https://${url}`)) {
            url = "https://" + url;
        } else {
            url = "http://" + url;
        }

        urlExists(url, function(err, exists) {
            if (exists) {
                function generateURL() {
                    var randomString = characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)] + characters[Math.floor(Math.random() * characters.length)];
                    
                    database.query(`SELECT * FROM \`short\` WHERE id="${req.params.customid}"`, function (error, result, fields) {
                        if (result[0]) {
                            generateURL();
                        } else {
                            database.query(`INSERT INTO \`short\` VALUES ("${randomString}", "${url}", "${req.params.domain}", "${req.params.username}", ${parseInt(req.params.expires)})`);
                            
                            res.json({ "success": true, "message": randomString });
                        }
                    });
                }
                
                generateURL();
            } else {
                res.json({"success": false, "message": "Invalid URL"});
            }
        });
    });

    app.get("/short/check/:url/", (req, res) => {
        (async function () {
            var https = await isReachable(`https://${decodeURIComponent(req.params.url)}`);
            var http = await isReachable(`http://${decodeURIComponent(req.params.url)}`);
            res.json({ "https": https, "http": http });
        })();
    });
}