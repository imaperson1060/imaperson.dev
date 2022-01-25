import crypto from "crypto";
import fetch from "node-fetch";

export default function (app) {
    function changeStatus(status) {
        const monitors = [ 790456436 ];

        monitors.forEach(async x => {
            const response = await fetch("https://api.uptimerobot.com/v2/editMonitor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    api_key: process.env.UPTIMEROBOT,
                    id: x,
                    status
                })
            });
        });
    }

    app.get("/stop/:password", async (req, res) => {
        if (req.params.password != process.env.PASSWORD) return;

        await changeStatus("0");
        res.sendStatus(200);
        setTimeout(() => { process.exit(2) }, 1000);
    });

    app.post("/restart/", async (req, res) => {
        const expectedSignature = "sha1=" +
            crypto.createHmac("sha1", process.env.PASSWORD)
                .update(JSON.stringify(req.body))
                .digest("hex");
    
        const signature = req.headers["x-hub-signature"];
        if (signature == expectedSignature) {
            await changeStatus("0");
            res.sendStatus(200);
            setTimeout(() => { process.exit() }, 1000);
        }
    });

    changeStatus("1");
}