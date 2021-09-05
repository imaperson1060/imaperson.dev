module.exports = (app, cors, fetch, imageToBase64, query, urlExists, ytdl) => {
    function findObjectByKey(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }

    async function getVideoDetails(id) {
        const db = (await query("SELECT * FROM `yt` WHERE id=?", [id]))[0];
        if (db && db.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
            return { success: true, formats: JSON.parse(db.formats), author: decodeURIComponent(db.author), title: decodeURIComponent(db.title), description: decodeURIComponent(db.description), thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
        }

        const videoInfo = await ytdl.getInfo(id);

        var hd;
        try { hd = findObjectByKey(videoInfo.formats, "itag", 22).url; } catch (e) {}
        var sd = findObjectByKey(videoInfo.formats, "itag", 18).url;
        var audio = findObjectByKey(videoInfo.formats, "itag", 140).url;
        var formats = { hd: hd, sd: sd, audio: audio };

        if ((await query("SELECT * FROM `yt` WHERE id=?", [id]))[0]) {
            await query("UPDATE `yt` SET author=?, title=?, description=?, formats=?, timestamp=? WHERE id=?", [encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description), JSON.stringify(formats), Math.round(new Date().getTime() / 1000), id]);
        } else {
            await query("INSERT INTO `yt` VALUES (?,?,?,?,?,?)", [id, videoInfo.videoDetails.author.name, videoInfo.videoDetails.title, videoInfo.videoDetails.description, JSON.stringify(formats), Math.round(new Date().getTime() / 1000)])
        }

        return { success: true, formats: formats, author: videoInfo.videoDetails.author.name, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
    }

    app.get("/yt/validate/:id/", cors(), async (req, res) => {
        res.json({ success: (await urlExists(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${req.params.id}`)) });
    });

    app.get("/yt/watch/:id", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        if (video.success) return res.redirect(video.formats.hd ? video.formats.hd : video.formats.sd);

        res.redirect("/yt/");
    });

    app.get("/yt/getInfo/all/:id/", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        res.json({ success: true, formats: video.formats, author: video.author, title: video.title, description: video.description });
    });

    app.get("/yt/getInfo/url/:id/", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        res.json({ success: true, formats: video.formats });
    });

    app.get("/yt/getInfo/author/:id/", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        res.json({ success: true, author: video.author });
    });

    app.get("/yt/getInfo/title/:id/", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        res.json({ success: true, title: video.title });
    });
    
    app.get("/yt/getInfo/description/:id/", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        res.json({ success: true, description: video.description });
    });

    app.get("/yt/getInfo/thumb/:id/", cors(), async (req, res) => {
        res.json({ "success": true, "thumb": `https://i.ytimg.com/vi/${req.params.id}/hqdefault.jpg` });
    });

    app.get("/yt/getInfo/thumb/:id/view/", cors(), (req, res) => {
        imageToBase64(`https://i.ytimg.com/vi/${req.params.id}/hqdefault.jpg`).then((thumb) => {
            res.end(new Buffer.from(thumb, "base64"));
        });
    });

    app.get("/yt/search/:query/:page?", cors(), async (req, res) => {
        const result = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${process.env.GOOGLEAPI}&max_results=25&type=video&q=${decodeURIComponent(req.params.query)}${req.params.page ? `&page_token=${req.params.page}` : ""}`);
        const body = await result.json();

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
}