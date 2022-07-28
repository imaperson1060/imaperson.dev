import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";

const yt = { dl: ytdl, pl: ytpl, sr: ytsr };

export default async (io, socket, args) => {
    if (!args[0] || !args[0].id) return socket.emit("yt-getPlaylist", { success: false, message: "invalidargs", args });

    socket.emit("yt-getPlaylist", { success: true, playlist: await yt.pl(args[0].id), args });
}