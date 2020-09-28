function setActivity() {
	const client = require("discord-rich-presence")("748654462121410740");

	client.on("connected", () => {
		console.log("connected!");
		startTimestamp = new Date();
		client.updatePresence({
			state: "watchin anime",
			startTimestamp,
			largeImageKey: "logo",
			instance: true,
		});

		setInterval(() => {
			client.updatePresence({
				state: "watchin anime",
				startTimestamp,
				largeImageKey: "logo",
			});
		}, 15500);
	});

	process.on("unhandledRejection", console.error);
}

module.exports = setActivity;
