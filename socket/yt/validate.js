import util from "util";

var urlExists = util.promisify(urlexists).bind(urlexists);

export default async (io, socket, args) => {
    if (!args[0] || !args[0].id) return socket.emit("yt", "validate-video", { success: false, message: "invalidargs", args });

	const url = await (await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${args[0].id}`)).json();

    socket.emit("yt-validate", { success: url.https || url.http, args });
}