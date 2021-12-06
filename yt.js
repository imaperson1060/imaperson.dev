export default function (app, cors, query, urlExists, yt) {
    async function getVideoDetails(id, cookie) {
        const db = (await query("SELECT * FROM `yt` WHERE id=?", [id]))[0];
        if (db && db.timestamp + 21600 >= Math.round(new Date().getTime() / 1000)) {
            return { success: true, formats: JSON.parse(decodeURIComponent(db.formats)), author: decodeURIComponent(db.author), title: decodeURIComponent(db.title), description: decodeURIComponent(db.description), thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
        }

        var videoInfo;
        if (cookie) {
            videoInfo = await yt.dl.getInfo(id, { requestOptions: { headers: { cookie } } });
        } else {
            try {
                videoInfo = await yt.dl.getInfo(id);
            } catch (e) {
                if (e.statusCode == 410) return { success: false, message: "cookies_required" };
                return { success: false, e };
            }
        }
        
        var hd;
        try { hd = videoInfo.formats.find(x => x.itag == 22).url; } catch (e) {}
        var sd = videoInfo.formats.find(x => x.itag == 18).url;
        var audio = videoInfo.formats.find(x => x.itag == 140).url;
        var formats = { hd, sd, audio };

        if ((await query("SELECT * FROM `yt` WHERE id=?", [id]))[0]) {
            await query("UPDATE `yt` SET author=?, title=?, description=?, formats=?, timestamp=? WHERE id=?", [encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description), JSON.stringify(formats), Math.round(new Date().getTime() / 1000), id]);
        } else {
            await query("INSERT INTO `yt` VALUES (?,?,?,?,?,?)", [id, encodeURIComponent(videoInfo.videoDetails.author.name), encodeURIComponent(videoInfo.videoDetails.title), encodeURIComponent(videoInfo.videoDetails.description) || "", JSON.stringify(formats), Math.round(new Date().getTime() / 1000)])
        }

        return { success: true, formats: formats, info: { author: videoInfo.videoDetails.author.name, title: videoInfo.videoDetails.title, description: videoInfo.videoDetails.description, thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` } };
    }

    app.get("/yt/validate/:id/", cors(), async (req, res) => {
        res.json({ success: (await urlExists(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${req.params.id}`)) });
    });

    app.get("/yt/validate/playlist/:id/", cors(), async (req, res) => {
        res.json({ success: (await urlExists(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${req.params.id}`)) });
    });

    app.get("/yt/watch/:id", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id);

        if (video.success) return res.redirect(video.formats.hd || video.formats.sd);

        res.redirect("/yt/");
    });

    app.get("/yt/getInfo/all/:id/:cookie?", cors(), async (req, res) => {
        const video = await getVideoDetails(req.params.id, req.params.cookie ? decodeURIComponent(req.params.cookie) : undefined);

        res.json(video);
    });

    app.get("/yt/getInfo/url/:id/:cookie?", cors(), async (req, res) => {
        var video = await getVideoDetails(req.params.id, req.params.cookie ? decodeURIComponent(req.params.cookie) : undefined);

        delete video.info;

        res.json(video);
    });
}