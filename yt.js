module.exports = (app, cors, imageToBase64, query, urlExists, yt) => {
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
            return { success: true, formats: JSON.parse(decodeURIComponent(db.formats)), author: decodeURIComponent(db.author), title: decodeURIComponent(db.title), description: decodeURIComponent(db.description), thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
        }

        const videoInfo = await yt.dl.getInfo(id);

        var hd;
        try { hd = findObjectByKey(videoInfo.formats, "itag", 22).url; } catch (e) {}
        var sd = findObjectByKey(videoInfo.formats, "itag", 18).url;
        var audio = findObjectByKey(videoInfo.formats, "itag", 140).url;
        var formats = { hd: hd, sd: sd, audio: audio };

        if ((await query("SELECT * FROM `yt` WHERE id=?", [id]))[0]) {
            await query("UPDATE `yt` SET author=?, title=?, description=?, formats=?, timestamp=? WHERE id=?", [encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description), JSON.stringify(formats), Math.round(new Date().getTime() / 1000), id]);
        } else {
            await query("INSERT INTO `yt` VALUES (?,?,?,?,?,?)", [id, encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description) || "", JSON.stringify(formats), Math.round(new Date().getTime() / 1000)])
        }

        return { success: true, formats: formats, author: videoInfo.videoDetails.author.name, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
    }

    app.get("/yt/validate/:id/", cors(), async (req, res) => {
        res.json({ success: (await urlExists(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${req.params.id}`)) });
    });

    app.get("/yt/validate/playlist/:id/", cors(), async (req, res) => {
        res.json({ success: (await urlExists(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${req.params.id}`)) });
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

    /*app.get("/yt/playlist/:id/:short?", async (req, res) => {
        var result = await yt.pl(req.params.id);

        if (req.params.short == "true") {
            var tempResult = new Array(result.items.length);
            result.items.forEach((x, i) => {
                tempResult[i] = x.id;
            });
            result = tempResult;
        }

        res.json(result);
    });

    app.all("/yt/search/:query?/:short?", cors(), async (req, res) => {
        if (!req.body.continuation && req.params.query) {

            var results = await yt.sr((await (await yt.sr.getFilters(req.params.query)).get("Type").get("Video")).url, { pages: 1 });
            delete results.refinements;

            if (req.params.short == "true") {
                var tempResult = new Array(results.items.length);
                results.items.forEach((x, i) => {
                    tempResult[i] = x.id;
                });
                results = { items: tempResult, continuation: results.continuation };
            }

            return res.json(results);
        } else if (req.body.continuation) {
            var results = await yt.sr.continueReq(req.body.continuation);
            delete results.refinements;

            if (req.body.short == "true" || req.body.short == true) {
                var tempResult = new Array(results.items.length);
                results.items.forEach((x, i) => {
                    tempResult[i] = x.id;
                });
                results = { items: tempResult, continuation: results.continuation };
            }

            return res.json(results);
        }

        res.json({ success: false });
    });

    // (async() => console.log(await yt.sr("minecraft")))();

    // await yt.pl("id")

    /*app.get("/yt/bulk/playlist/:pid/:password", (req, res) => {
        if (req.params.password != process.env.PASSWORD) return res.sendStatus(401);

        var playlist = { "results": [] };

        (async function plist() {
            const playlistData = await getPlaylist(req.params.pid, playlist.next ? playlist.next : undefined);
            
            if (!playlistData.success) res.json(playlistData);

            playlistData.results.forEach(x => playlist.results.push(x));

            playlist.info = playlistData.info || playlist.info;

            if (playlistData.next) {
                playlist.next = playlistData.next;
                return plist();
            }
            
            delete playlist.next;

            playlist.success = true;

            res.send(playlist);

            /*var archive = archiver("zip");
            res.attachment(`${playlist.info.title}.zip`);
            archive.pipe(res);

            var upto = 1;

            playlist.results.forEach(async (x, i) => {
                const video = await getVideoDetails(x);
                await archive.append(await (await fetch(video.formats.hd ? video.formats.hd : video.formats.sd)).buffer(), { name: `${video.title.replace(/[\\\/:\*\?"<>\|]/g, "_")}.mp4` });

                if (upto == playlist.results.length) archive.finalize();

                upto++;
            });*/
        /*})();
    });*/

    /*app.get("/yt/bulk/list/:listjson/:password", (req, res) => {
        if (req.params.password != process.env.PASSWORD) return res.sendStatus(401);

        var videos= [];

        (async function plist() {
            const playlistData = await getPlaylist(req.params.pid, playlist.next ? playlist.next : undefined);
            
            if (!playlistData.success) res.json(playlistData);

            playlistData.results.forEach(x => playlist.results.push(x));

            playlist.info = playlistData.info || playlist.info;

            if (playlistData.next) {
                playlist.next = playlistData.next;
                return plist();
            }
            
            delete playlist.next;

            var archive = archiver("zip");
            res.attachment(`${playlist.info.title}.zip`);
            archive.pipe(res);

            var upto = 1;

            playlist.results.forEach(async (x, i) => {
                const video = await getVideoDetails(x);
                await archive.append(await (await fetch(video.formats.hd ? video.formats.hd : video.formats.sd)).buffer(), { name: `${video.title.replace(/[\\\/:\*\?"<>\|]/g, "_")}.mp4` });

                if (upto == playlist.results.length) archive.finalize();

                upto++;
            });
        })();
    });*/
}