import fs from "fs";

export default (io, socket) => socket.onAny(async (page, func, ...args) => {
    if (fs.existsSync(`./socket/${page}/${func}.js`)) {
        (await import(`./${page}/${func}.js`)).default(io, socket, args);
    }
});