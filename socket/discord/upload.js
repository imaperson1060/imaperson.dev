export default async (req, res, io) => {
    if (!req.params.id) return;

    io.sockets.sockets.get(req.params.id)?.emit("discord-response", { res: req.body });

    return res.sendStatus(200);
}