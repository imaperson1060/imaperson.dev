module.exports = (app, cors, mail, md5, query, rateLimit) => {
    const accountLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 1 minute
        max: 1,
        message: { "success": false, "message": "Only one account can be created every 15 minutes." }
    });

    app.get("/signup/:name/:username/:email/:password", accountLimiter, cors(), async (req, res) => {
        if (req.params.username.length > 32) {
            return res.json({ "success": false, "message": `Username "${req.params.username}" is too long.` });
        }
        
        function capitalize(str) {
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        
        if ((await query("SELECT * FROM `accounts` WHERE username=?", [req.params.username]))[0]) return res.json({ success: false, message: `Username "${req.params.username}" has been taken.` })
        if ((await query("SELECT * FROM `accounts` WHERE email=?", [req.params.email]))[0]) return res.json({ success: false, message: `Email "${req.params.email}" is already in use.`});
        
        var timestamp = Math.round(new Date().getTime() / 1000);
        
        var highestId = (await query("SELECT MAX(id) AS highestId FROM `accounts` LIMIT 1")).highestId || 0;
                        
        await mail(req.params.email, "Welcome", `<h1>Hey, ${capitalize(req.params.name)}! Thanks for creating an account on my website!</h1> <h2>If you have any questions, feel free to <a href="mailto:me@arimeisels.com">shoot me an email</a>!</h3> <style>* { font-family: sans-serif }</style>`);
                        
        await query("INSERT INTO `accounts` VALUES (?,?,?,?,?,?)", [highestId + 1, req.params.username, capitalize(req.params.name), req.params.email, md5(req.params.password), timestamp]);
                
        res.json({ success: true, message: `Account "${req.params.username}" has been created.` });
    });

    app.get("/login/:username/:password", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE username=?", [req.params.username]))[0];

        if (!info) return res.json({ success: false, message: `Account ${req.params.username} does not exist.` });
        
        if ((req.params.password == info.password) || (md5(req.params.password) == info.password)) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: `The password is incorrect.` });
        }
    });

    app.get("/forgot/:email/", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE email=?", [req.params.email]))[0];
        
        if (!info) return res.json({ success: false, message: `There is no account linked to ${req.params.email}.` });

        await mail(info.email, "Reset Password", `<h1>Hi, ${info.name}!</h1> <h2>Click <a href="https://api.arimeisels.com/reset/${info.username}/${md5(info.username + info.password)}/">here</a> to reset your password!</h2> <h3>If you did not request to have your password reset, please ignore this email.</h3> <style>* { font-family: sans-serif }</style>`);

        res.json({ "success": true });
    });

    app.get("/reset/:username/:code/", cors(), async (req, res) => {
        const info = (await query("SELECT * FROM `accounts` WHERE username?", [req.params.username]))[0];

        if (!info) return res.json({ success: false, message: `Account ${req.params.username} does not exist.` });

        if (req.params.code == md5(info.username + info.password)) {
            const newPassword = md5(Math.floor(Date.now() / 1000) + info.password);

            await mail(info.email, "Password Reset", `<h1>Hi, ${info.name}!</h1> <h2>Your password was just reset to "${newPassword}" about a minute ago. Just thought you should know in case it wasn't you!</h2> <style>* { font-family: sans-serif }</style>`);

            await query("UPDATE `accounts` SET password=? WHERE username=?", [md5(newPassword), req.params.username]);

            res.json({ success: true, message: newPassword });
        } else {
            res.json({ success: false, message: `The access code is incorrect.`});
        }
    });
}