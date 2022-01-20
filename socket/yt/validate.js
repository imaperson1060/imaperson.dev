import urlexists from "url-exists";
import util from "util";

var urlExists = util.promisify(urlexists).bind(urlexists);

export default async (io, socket, args) => {
    if (!args[0] || !args[0].id) return socket.emit("yt", "validate-video", { success: false, message: "invalidargs", args });

    socket.emit("yt-validate", { success: (await urlExists(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${args[0].id}`)), args });
}