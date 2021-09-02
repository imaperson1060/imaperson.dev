module.exports = (io) => {
    io.on("connection", (socket) => {
        socket.on("a", (msg) => {
            console.log(msg);
        });
    });
}