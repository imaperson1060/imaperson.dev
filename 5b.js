module.exports = (app, cors, database, jsonSchema, md5) => {
    function validateSave(save) {
        var v = new jsonSchema.Validator();
        var schema = {
            "required": [
                "timer",
                "deathCount",
                "levelCount",
                "levelProgress",
                "coins",
                "gotCoin"
            ],
            "properties": {
                "levelCount": {
                    "type": "number",
                    "minimum": 0
                },
                "timer": {
                    "type": "number",
                    "minimum": 0
                },
                "deathCount": {
                    "type": "number",
                    "minimum": 0
                },
                "levelProgress": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": save.levelCount
                },
                "coins": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": save.levelCount
                },
                "gotCoin": {
                    "type": "array",
                    "minItems": save.levelCount,
  			        "maxItems": save.levelCount,
                    "items": {
                        "type": "boolean"
                    }
                }
            }
        }
        
        return v.validate(save, schema).valid;
    }

    app.post("/5b/save/", cors(), (req, res) => {
        if (!req.body.username) return res.json({ "success": false, "message": "You must include a username in your request." });
        if (!req.body.password) return res.json({ "success": false, "message": "You must include a password in your request." });
        if (!req.body.save) return res.json({ "success": false, "message": "No savefile" });
        if (!validateSave(JSON.parse(req.body.save))) return res.json({ "success": false, "message": "Invalid savefile" });

        database.query(`SELECT * FROM \`accounts\` WHERE username="${req.body.username}" AND password="${md5(req.body.password)}"`, function (error, result, fields) {
            if (error) return error;
            if (!result[0]) return res.json({ "success": false, "message": "Incorrect login credidentials." });

            database.query(`SELECT * FROM \`5b_saves\` WHERE username="${req.body.username}"`, function (error, result, fields) {
                if (error) return error;
                
                if (result[0]) {
                    database.query(`UPDATE \`5b_saves\` SET \`save\`='${req.body.save}' WHERE username="${req.body.username}"`);
                } else {
                    database.query(`INSERT INTO \`5b_saves\` VALUES ("${req.body.username}", '${req.body.save}')`);
                }

                res.json({ "success": true });
                console.log(req.body.save)
            });
        });
    });

    app.post("/5b/get_save/", cors(), (req, res) => {
        if (!req.body.username) return res.json({ "success": false, "message": "You must include a username in your request." });

        database.query(`SELECT * FROM \`5b_saves\` WHERE username="${req.body.username}"`, function (error, result, fields) {
            if (!result[0]) return res.json("{\"levelCount\":53,\"timer\":0,\"deathCount\":0,\"levelProgress\":0,\"coins\":0,\"gotCoin\":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]}");
            res.json(result[0].save);
        });
    });
}