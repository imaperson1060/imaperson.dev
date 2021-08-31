module.exports = (app, cors, database, imageToBase64, request, urlExists, ytdl) => {
    function findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }

    async function getVideoDetails(id, callback) {
        var videoInfo = await ytdl.getInfo(id);
        try {
            let hd = findObjectByKey(videoInfo.formats, "itag", 22).url;
            let sd = findObjectByKey(videoInfo.formats, "itag", 18).url;
        
            if (!sd || !hd) {
                var a = undefined;
                var b = a.b.c;
            }

            callback({ "success": true, "url": hd, "author": videoInfo.videoDetails.author.name, "title": videoInfo.videoDetails.title, "description": videoInfo.videoDetails.description, "thumbnail": `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
        } catch(err) {
            try {
                let sd = findObjectByKey(videoInfo.formats, "itag", 18).url;

                callback({ "success": true, "url": sd, "author": videoInfo.videoDetails.author.name, "title": videoInfo.videoDetails.title, "description": videoInfo.videoDetails.description, "thumbnail": `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
            } catch(err) {
                callback({ "success": false, "message": err.message })
            }
        }
        // RIP
        /*request.post({ "url": `https://youtubei.googleapis.com/youtubei/v1/player?key=${process.env.INNERTUBE}`, json: { "context": { "client": { "hl": "en", "clientName": "WEB", "clientVersion": "2.20210721.00.00" } }, "videoId": id } },  (err, response, body) => {
            
            if (err) { return console.log(err); }

            try {
                let hd = findObjectByKey(body.streamingData.formats, "itag", 22).url;
                let sd = findObjectByKey(body.streamingData.formats, "itag", 18).url;
                
                if (!sd || !hd) {
                    var a = undefined;
                    var b = a.b.c;
                }

                callback({ "success": true, "url": hd, "author": body.videoDetails.author, "title": body.videoDetails.title, "description": body.videoDetails.shortDescription, "thumbnail": `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
            } catch(err) {
                try {
                    let sd = findObjectByKey(body.streamingData.formats, "itag", 18).url;

                    if (!sd) {
                        request(`https://maadhav-ytdl.herokuapp.com/video_info.php?url=https://www.youtube.com/watch?v=${id}`, (err, response, body2) => {
                            if (err) { return console.log(err); }
                
                            sd = JSON.parse(body2).links[0];
    
                            callback({ "success": true, "url": sd, "author": body.videoDetails.author, "title": body.videoDetails.title, "description": body.videoDetails.shortDescription, "thumbnail": `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
                        });
                    } else {
                        callback({ "success": true, "url": sd, "author": body.videoDetails.author, "title": body.videoDetails.title, "description": body.videoDetails.shortDescription, "thumbnail": `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
                    }
                } catch(err) {
                    callback({ "success": false, "message": err.message })
                    //callback({ "success": false, "message": `${Buffer.from(err.message).toString("base64")}` });
                }
            }
        });*/
    }

    app.get("/yt/", (req, res) => {
        res.sendFile("./static/yt/yt.html", { root: __dirname });
    });

    app.get("/yt/search/", (req, res) => {
        res.sendFile("./static/yt/search.html", { root: __dirname });
    });

    app.get("/yt/validate/:id/", cors(), (req, res) => {
        urlExists(`https://i.ytimg.com/vi/${req.params.id}/mqdefault.jpg`, function (err, exists) {
            res.json({ "success": exists });
        });
    });

    app.get("/yt/watch/:id", cors(), (req, res) => {
        getVideoDetails(req.params.id, function (responseJSON) {
            if (responseJSON.success) {
                database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                    if (result && (result[0])) {
                        database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                    } else {
                        database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                    }
                            
                    res.redirect(responseJSON.url);
                });
            } else {
                res.redirect("https://arimeisels.com/yt/");
            }
        });
    });

    app.get("/yt/getInfo/all/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if ((result) && (result[0])) {
                if (result[0].timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
                    res.json({ "success": true, "url": result[0].videoURL, "author": decodeURIComponent(result[0].author), "title": decodeURIComponent(result[0].title), "description": decodeURIComponent(result[0].description), "lastUpdate": result[0].timestamp });
                }
            }

            getVideoDetails(req.params.id, function (responseJSON) {
                if (responseJSON.success) {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (result && (result[0])) {
                            database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                        } else {
                            database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                        }

                        if (!result || !result[0] || result[0].timestamp + 21600 < Math.round(new Date().getTime() / 1000)) {
                            res.json({ "success": true, "url": responseJSON.url, "author": responseJSON.author, "title": responseJSON.title, "description": responseJSON.description, "lastUpdate": Math.round(new Date().getTime() / 1000) });
                        }
                    });
                } else {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (!result[0]) {
                            res.json({ "success": false, "code": responseJSON.message });
                        }
                    });
                }
            });
        });
    });

    app.get("/yt/getInfo/url/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result && (result[0])) {
                if (result[0].timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
                    res.json({ "success": true, "url": result[0].videoURL, "lastUpdate": result[0].timestamp });
                }
            }

            getVideoDetails(req.params.id, function (responseJSON) {
                if (responseJSON.success) {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (result && (result[0])) {
                            database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                        } else {
                            database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                        }
                        
                        if (!result[0] || result[0].timestamp + 21600 < Math.round(new Date().getTime() / 1000)) {
                            res.json({ "success": true, "url": responseJSON.url, "lastUpdate": Math.round(new Date().getTime() / 1000) });
                        }
                    });
                } else {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (!result[0]) {
                            res.json({ "success": false, "code": responseJSON.message });
                        }
                    });
                }
            });
        });
    });

    app.get("/yt/getInfo/author/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result && (result[0])) {
                res.json({ "success": true, "author": decodeURIComponent(result[0].author), "lastUpdate": result[0].timestamp });
            }
            
            getVideoDetails(req.params.id, function (responseJSON) {
                if (responseJSON.success) {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (result && (result[0])) {
                            database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                        } else {
                            database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                            
                            res.json({"success": true, "author": responseJSON.author, "lastUpdate": Math.round(new Date().getTime() / 1000)});
                        }
                    });
                } else {    
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (!result[0]) {
                            res.json({ "success": false, "code": responseJSON.message });
                        }
                    });
                }
            });
        });
    });

    app.get("/yt/getInfo/title/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result && (result[0])) {
                res.json({ "success": true, "title": decodeURIComponent(result[0].title), "lastUpdate": result[0].timestamp });
            }

            getVideoDetails(req.params.id, function (responseJSON) {
                if (responseJSON.success) {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (result && (result[0])) {
                            database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                        } else {
                            database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                                    
                            res.json({ "success": true, "title": responseJSON.title, "lastUpdate": Math.round(new Date().getTime() / 1000) });
                        }
                    });
                } else {    
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (!result[0]) {
                            res.json({ "success": false, "code": responseJSON.message });
                        }
                    });
                }
            });
        });
    });
    
    app.get("/yt/getInfo/description/:id/", cors(), (req, res) => {
        database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
            if (result && (result[0])) {
                res.json({ "success": true, "description": decodeURIComponent(result[0].description), "lastUpdate": result[0].timestamp });
            }

            getVideoDetails(req.params.id, function (responseJSON) {
                if (responseJSON.success) {
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (result && (result[0])) {
                            database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                        } else {
                            database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                                    
                            res.json({ "success": true, "title": responseJSON.description, "lastUpdate": Math.round(new Date().getTime() / 1000) });
                        }
                    });
                } else {    
                    database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                        if (!result[0]) {
                            res.json({ "success": false, "code": responseJSON.message });
                        }
                    });
                }
            });
        });
    });

    app.get("/yt/getInfo/thumb/:id/", cors(), (req, res) => {
        res.json({ "success": true, "thumb": `https://i.ytimg.com/vi/${req.params.id}/mqdefault.jpg` });

        getVideoDetails(req.params.id, function (responseJSON) {
            if (responseJSON.success) {
                database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                    if (result && (result[0])) {
                        database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                    } else {
                        database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                                    
                        res.json({ "success": true, "thumb": `https://i.ytimg.com/vi/${req.params.id}/mqdefault.jpg` });
                    }
                });
            } else {
                database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                    if (!result[0]) {
                        res.json({ "success": false, "code": responseJSON.message });
                    }
                });
            }
        });
    });

    app.get("/yt/getInfo/thumb/:id/view/", cors(), (req, res) => {
        getVideoDetails(req.params.id, function (responseJSON) {
            if (responseJSON.success) {
                imageToBase64(responseJSON.thumbnail)
                    .then((thumb) => {
                        res.end(new Buffer(thumb, "base64"));
                    });

                database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                    if (result && (result[0])) {
                        database.query(`UPDATE \`yt\` SET \`author\`="${encodeURIComponent(responseJSON.author)}", \`title\`="${encodeURIComponent(responseJSON.title)}", \`description\`="${encodeURIComponent(responseJSON.description)}", \`videoURL\`="${responseJSON.url}", \`timestamp\`=${Math.round(new Date().getTime() / 1000)} WHERE id="${req.params.id}"`);
                    } else {
                        database.query(`INSERT INTO \`yt\` VALUES ("${req.params.id}", "${encodeURIComponent(responseJSON.author)}", "${encodeURIComponent(responseJSON.title)}", "${encodeURIComponent(responseJSON.description)}", "${responseJSON.URL}", ${Math.round(new Date().getTime() / 1000)})`);
                    }
                });
            } else {
                database.query(`SELECT * FROM \`yt\` WHERE id="${req.params.id}"`, function (error, result, fields) {
                    if (!result[0]) {
                        res.json({ "success": false, "code": responseJSON.message });
                    }
                });
            }
        });
    });

    app.get("/yt/search/:query/", cors(), (req, res) => {
        request(`https://www.googleapis.com/youtube/v3/search?key=${process.env.GOOGLEAPI}&max_results=25&type=video&q=${decodeURIComponent(req.params.query)}`, (err, response, body) => {
            if (err) { return console.log(err); }

            body = JSON.parse(body);

            function checkQuota() {
                if (body.error && body.error.message == "The request cannot be completed because you have exceeded your <a href=\"/youtube/v3/getting-started#quota\">quota</a>.") {
                    return "quota"
                } else {
                    return "forbidden"
                }
            }

            const ytErrors = {
                400: "badRequest",
                401: "unauthorized",
                403: checkQuota(),
                404: "not found"
            };

            if (body.error) { return res.json({ "success": false, "reason": ytErrors[body.error.code], "message": body.error.message }); }

            var videoIds = new Array(24);

            for (var i = 0; i < body.items.length; i++) {
                videoIds[i] = body.items[i].id.videoId;
            }

            res.json({ "success": true, "next": body.nextPageToken, "back": body.prevPageToken, "results": videoIds });
        });
    });

    app.get("/yt/search/:query/:page/", cors(), (req, res) => {
        request(`https://www.googleapis.com/youtube/v3/search?key=${process.env.GOOGLEAPI}&max_results=25&type=video&q=${decodeURIComponent(req.params.query)}&page_token=${req.params.page}`, (err, response, body) => {
            if (err) { return console.log(err); }

            body = JSON.parse(body);

            function checkQuota() {
                if (body.error && body.error.message == "The request cannot be completed because you have exceeded your <a href=\"/youtube/v3/getting-started#quota\">quota</a>.") {
                    return "quota"
                } else {
                    return "forbidden"
                }
            }

            const ytErrors = {
                400: "badRequest",
                401: "unauthorized",
                403: checkQuota(),
                404: "not found"
            };

            if (body.error) { return res.json({ "success": false, "reason": ytErrors[body.error.code], "message": body.error.message }); }

            var videoIds = new Array(24);

            for (var i = 0; i < body.items.length; i++) {
                videoIds[i] = body.items[i].id.videoId;
            }

            res.json({ "success": true, "next": body.nextPageToken, "back": body.prevPageToken, "results": videoIds });
        });
    });
}