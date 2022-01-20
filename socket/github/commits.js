import moment from "moment";
import fetch from "node-fetch";
export default async (io, socket, args) => {
    var commits = await fetch(`https://api.github.com/repos/imaperson1060/arimeisels.com/commits?per_page=100&since=${moment().subtract(7, "d").toISOString()}`, {
        headers: {
            Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}`
        }
    });

    commits = await commits.json();

    for await (const x of commits) {
        x.stats = (await (await fetch(`https://api.github.com/repos/imaperson1060/arimeisels.com/commits/${x.sha}`, {
            headers: {
                Authorization: `Basic ${btoa(`imaperson1060:${process.env.GITHUB_TOKEN}`)}`
            }
        })).json()).stats;
    }

    socket.emit("github-commits", { commits, args });
}