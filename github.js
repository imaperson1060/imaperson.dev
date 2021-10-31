export default function (app, cors, fetch, sha1) {
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
        console.log(req.headers["x-hub-signature"])
        if (req.headers["x-hub-signature"] == sha1(process.env.PASSWORD)) {
            res.sendStatus(200);
            process.exit();
        }
    });
}