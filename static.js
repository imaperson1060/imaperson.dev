module.exports = (app, cors, fetch) => {
    app.get("/", cors(), (req, res) => {
        res.sendFile("./static/index.html", { root: __dirname })
    });
    
    app.get("/nav.html", cors(), (req, res) => {
        res.sendFile("./static/navbar/nav.html", { root: __dirname })
    });

    app.get("/nav.js", cors(), (req, res) => {
        res.sendFile("./static/navbar/nav.js", { root: __dirname })
    });

    app.get("/utils/", (req, res) => {
        res.sendFile("./static/utils.html", { root: __dirname });
    });

    app.get("/short/", cors(), (req, res) => {
        res.sendFile("./static/short.html", { root: __dirname });
    });

    app.get("/contact/", (req, res) => {
        res.sendFile("./static/contact.html", { root: __dirname });
    });
    
    app.get("/about/", (req, res) => {
        res.sendFile("./static/about.html", { root: __dirname });
    });

    app.get("/favicon.ico", (req, res) => {
        res.sendFile("./static/favicon.png", { root: __dirname });
    });
}