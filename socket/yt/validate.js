export default async (io, socket, args) => {
    if (!args[0] || !args[0].id) return socket.emit("yt", "validate-video", { success: false, message: "invalidargs", args });

	const url = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${args[0].id}`);

    socket.emit("yt-validate", { success: url.ok, args });
}