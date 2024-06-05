import crypto from "crypto";

export async function changeStatus(status) {
	const monitors = [ 790456436 ];
	monitors.forEach(async id => {
		await fetch("https://api.uptimerobot.com/v2/editMonitor", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ api_key: process.env.UPTIMEROBOT, id, status })
		});
	});
}

export default async (req, res) => {
	switch (req.method) {
		case "GET":
			if (!req.query.password) return res.status(400).json({ success: false, code: 400, error: "no password provided", args: req.query });
			if (req.query.password != process.env.PASSWORD) return res.status(401).json({ success: false, code: 401, error: "unauthorized", args: req.query });
			await changeStatus("0");
			res.status(200).json({ success: true, code: 200, message: "stopping server" });
			setTimeout(() => { process.exit(2) }, 1000);
			break;
		case "POST":
			const expectedSignature = "sha1=" + crypto.createHmac("sha1", process.env.PASSWORD).update(JSON.stringify(req.body)).digest("hex");
			if (req.headers["x-hub-signature"] == expectedSignature) {
				await changeStatus("0");
				res.status(200).json({ success: true, code: 200, message: "restarting server" });
				setTimeout(() => { process.exit() }, 1000);
			}
			break;
		default: return res.status(405).json({ success: false, code: 405, error: "method not allowed", args: req.body });
	}
}