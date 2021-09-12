module.exports = (app, cors, mail, md5, query, rateLimit) => {
    const accountLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 1 minute
        max: 1,
        message: { "success": false, "message": "ratelimit" }
    });

    app.get("/signup/:name/:username/:email/:password", accountLimiter, cors(), async (req, res) => {
        if (req.params.username.length > 32) return res.json({ success: false, message: "long" });
        if (("_! @#$%^&*,".indexOf(req.params.username) != -1) || req.params.username.startsWith("-")) return res.json({ "success": false, "message": "invalidchar" });
        if (JSON.parse(process.env.RESERVED).indexOf(req.params.username) != -1) return res.json({ success: false, message: "reserved" });
        if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(req.params.email.toLowerCase())) return res.json({ success: false, message: "invalidemail" });
        
        function capitalize(str) {
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        
        if ((await query("SELECT * FROM `accounts` WHERE username=?", [req.params.username]))[0]) return res.json({ success: false, message: "taken" })
        if ((await query("SELECT * FROM `accounts` WHERE email=?", [req.params.email]))[0]) return res.json({ success: false, message: "emailused" });
        
        var timestamp = Math.round(new Date().getTime() / 1000);
        
        await mail(req.params.email, "Welcome", `<h1>Hey, ${capitalize(req.params.name)}! Thanks for creating an account on my website!</h1> <h2>If you have any questions, feel free to <a href="mailto:me@arimeisels.com">shoot me an email</a>!</h3> <style>* { font-family: sans-serif }</style>`);
        
        await query("INSERT INTO `accounts`(`username`, `name`, `email`, `password`, `timestamp`) VALUES (?,?,?,?,?)", [req.params.username, capitalize(req.params.name), req.params.email, md5(req.params.password), timestamp]);

        res.json({ success: true });
        
        require("child_process").execSync(`pktriot tunnel http add --domain ${req.params.username}.arimeisels.com --destination localhost --http 8000 --letsencrypt && taskkill.exe /f /im pktriot.exe`);
    });

    app.get("/login/:username/:password", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE username=?", [req.params.username]))[0];

        if (!info) return res.json({ success: false, message: "noaccount" });
        
        if ((req.params.password == info.password) || (md5(req.params.password) == info.password)) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "wrongpass" });
        }
    });

    app.get("/forgot/:email/", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE email=?", [req.params.email]))[0];
        
        if (!info) return res.json({ success: false, message: "noaccountlinked" });

        await mail(info.email, "Reset Password", `<h1>Hi, ${info.name}!</h1> <h2>Click <a href="https://api.arimeisels.com/reset.html?u=${info.username}&c=${md5(info.username + info.password)}">here</a> to reset your password!</h2> <h3>If you did not request to have your password reset, please ignore this email.</h3> <style>* { font-family: sans-serif }</style>`);

        res.json({ "success": true });
    });

    app.get("/reset/:username/:code/", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE username=?", [req.params.username]))[0];

        if (!info) return res.json({ success: false, message: "noaccount" });

        if (req.params.code == md5(info.username + info.password)) {
            const newPassword = md5(Math.floor(Date.now() / 1000) + info.password);

            await mail(info.email, "Password Reset", `<h1>Hi, ${info.name}!</h1> <h2>Your password was just reset to "${newPassword}" about a minute ago. Just thought you should know in case it wasn't you!</h2> <style>* { font-family: sans-serif }</style>`);

            await query("UPDATE `accounts` SET password=? WHERE username=?", [md5(newPassword), req.params.username]);

            res.json({ success: true, password: newPassword });
        } else {
            res.json({ success: false, message: "wrongcode" });
        }
    });
}