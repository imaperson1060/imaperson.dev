export default async function (client) {
    client.user.setActivity("being a person.");
    console.log(`${client.user.username} ready!`);
}