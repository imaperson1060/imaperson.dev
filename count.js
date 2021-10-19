const { response } = require("express");

module.exports = (app, query) => {
    app.get("/count/:name", async (req, res) => {
        const response = (await query("SELECT * FROM `viewcount` WHERE `name`=?", [ req.params.name ]))[0];
        if (!response) return res.sendStatus(404);
        delete response.token;
        res.json(response);
    });

    app.post("/count/up/:name/:token", async (req, res) => {
        const checkAuth = (await query("SELECT * FROM `viewcount` WHERE `name`=?", [ req.params.name ]))[0];
        if (checkAuth.token != req.params.token) return res.sendStatus(401);
        await query("UPDATE `viewcount` SET `views`=? WHERE name=?", [ checkAuth.views + 1, req.params.name ]);
        res.json({ success: true });
    });

    app.get("/count/create/:name", async (req, res) => {
        const checkExists = (await query("SELECT * FROM `viewcount` WHERE `name`=?", [ req.params.name ]))[0];
        if (checkExists) return res.json({ success: false, message: "NAME_TAKEN" });
        await query("INSERT INTO `viewcount`(`name`, `token`) VALUES (?, ?)", [ req.params.name, Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) ]);
        const getToken = (await query("SELECT * FROM `viewcount` WHERE `name`=?", [ req.params.name ]))[0];
        res.json({ success: true, token: getToken.token });
    });
}