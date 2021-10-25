module.exports = (app, cors, crypto, fetch) => {
    app.get("/get_commits/", cors(), async (req, res) => {
        var commits = await fetch("https://api.github.com/repos/meisels/arimeisels.com/commits?per_page=100", {
            headers: {
                Authorization: `Basic ${btoa(`meisels:${process.env.GITHUB_TOKEN}`)}`
            }
        });
        res.json(await commits.json());
    });

    app.get("/get_commit_info/:id", cors(), async (req, res) => {
        var commits = await fetch(`https://api.github.com/repos/meisels/arimeisels.com/commits/${req.params.id}`, {
            headers: {
                Authorization: `Basic ${btoa(`meisels:${process.env.GITHUB_TOKEN}`)}`
            }
        });
        res.json(await commits.json());
    });

    app.post("/restart/", (req, res) => {
        const expectedSignature = "sha1=" +
            crypto.createHmac("sha1", process.env.PASSWORD)
                .update(JSON.stringify(req.body))
                .digest("hex");
    
        const signature = req.headers["x-hub-signature"];
        if (signature == expectedSignature) {
            res.sendStatus(200);
            process.exit();
        }
    });
}