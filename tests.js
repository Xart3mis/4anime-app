/*
const client = require("discord-rich-presence")("748654462121410740");

client.on("connected", () => {
	console.log("connected!");

	client.updatePresence({
		state: "watchin anime",
		details: "watching https://4anime.to/bla-bla-bla",
		startTimestamp: new Date(),
		largeImageKey: "logo",
		smallImageKey: "logo",
	});
});

process.on("unhandledRejection", console.error);
*/

const setActivity = require("./src/Scripts/rpc");

setActivity("https://4anime.to/BLA");

setInterval(() => {
	setActivity("https://4anime.to/BLA");
}, 16000);
