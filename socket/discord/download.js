import fs from "fs";
import path from "path";

export default async (req, res, io) => {
    res.sendFile(`token-${req.params.id}`, { root: path.join(await path.resolve(), "socket/discord") });
    
    setTimeout(() => fs.rmSync(`socket/discord/token-${req.params.id}`), 5000);
}