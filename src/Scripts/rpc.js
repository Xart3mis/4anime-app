function setActivity(url) {
	const client = require("discord-rich-presence")("748654462121410740");

	client.on("connected", () => {
		console.log("connected!");

		client.updatePresence({
			state: "watchin anime",
			details: `watching ${url.split("/")[3]}`,
			startTimestamp: new Date(),
			largeImageKey: "logo",
			smallImageKey: "logo",
			instance: true,
		});
	});

	process.on("unhandledRejection", console.error);
}

module.exports = setActivity;
