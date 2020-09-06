const {
	app,
	BrowserWindow,
	Menu,
	globalShortcut,
	session,
	ipcMain,
	Tray,
	dialog,
	nativeImage,
} = require("electron");
const path = require("path");
const request = require("request");
const fs = require("fs");
const ElectronBlocker = require("@cliqz/adblocker-electron");

function handleSquirrelEvent(application) {
	if (process.argv.length === 1) {
		return false;
	}

	const ChildProcess = require("child_process");
	const path = require("path");

	const appFolder = path.resolve(process.execPath, "..");
	const rootAtomFolder = path.resolve(appFolder, "..");
	const updateDotExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
	const exeName = path.basename(process.execPath);

	const spawn = function (command, args) {
		let spawnedProcess, error;

		try {
			spawnedProcess = ChildProcess.spawn(command, args, {
				detached: true,
			});
		} catch (error) {}

		return spawnedProcess;
	};

	const spawnUpdate = function (args) {
		return spawn(updateDotExe, args);
	};

	const squirrelEvent = process.argv[1];
	switch (squirrelEvent) {
		case "--squirrel-install":
		case "--squirrel-updated":
			// Optionally do things such as:
			// - Add your .exe to the PATH
			// - Write to the registry for things like file associations and
			//   explorer context menus

			// Install desktop and start menu shortcuts
			spawnUpdate(["--createShortcut", exeName]);

			setTimeout(application.quit, 1000);
			return true;

		case "--squirrel-uninstall":
			// Undo anything you did in the --squirrel-install and
			// --squirrel-updated handlers

			// Remove desktop and start menu shortcuts
			spawnUpdate(["--removeShortcut", exeName]);

			setTimeout(application.quit, 1000);
			return true;

		case "--squirrel-obsolete":
			// This is called on the outgoing version of your app before
			// we update to the new version - it's the opposite of
			// --squirrel-updated

			application.quit();
			return true;
	}
}

if (handleSquirrelEvent(app)) {
	return;
}

let mainWindow;
let mainSplash;

const download = (url, path, callback) => {
	request.head(url, (err, res, body) => {
		try {
			request(url).pipe(fs.createWriteStream(path)).on("close", callback);
		} catch {
			console.log("Internet Connection error");
			ipcMain.emit("download-err");
		}
	});
};

const ezListUrl = "https://easylist-downloads.adblockplus.org/easylist.txt";
const ezListPath = path.join(__dirname, "assets/EasyList.txt");

function downloadNoArgs() {
	download(ezListUrl, ezListPath, () => {
		console.log("Done!");
		ipcMain.emit("Downloaded");
	});
}

/*
function getUpdate(){
    request('https://api.github.com/repos/Xart3mis/4anime-app/releases/latest', {json:true}, (err, res, body)=>{
        if(err){console.log(err)};
        console.log(body)
    })
}
*/

setTimeout(downloadNoArgs, 1400);

const createSplash = () => {
	mainSplash = new BrowserWindow({
		width: 400,
		height: 450,
		icon: path.join(__dirname, "assets/logo.png"),
		resizable: false,
		autoHideMenuBar: true,
		center: true,
		alwaysOnTop: true,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, "src/SplashScreen.html"),
			nodeIntegration: true,
		},
	});
	//mainSplash.webContents.openDevTools()

	mainSplash.setMenu(null);

	ipcMain.on("asynchronous-message", (event, arg) => {
		console.log(arg);

		// Event emitter for sending asynchronous messages
		event.sender.send("version", app.getVersion());
	});

	mainSplash.loadFile(path.join(__dirname, "src/SplashScreen.html"));
};

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 960,
		height: 540,
		icon: path.join(__dirname, "assets/logo.png"),
		minWidth: 480,
		minHeight: 270,
		autoHideMenuBar: true,
		resizable: true,
		center: true,
		show: false,
	});

	mainWindow.loadURL("https://4anime.to/");

	blocker = ElectronBlocker.ElectronBlocker.parse(
		fs.readFileSync(path.join(__dirname, "assets/EasyList.txt"), "utf-8")
	);
	blocker.enableBlockingInSession(session.defaultSession);

	mainWindow.loadURL("https://4anime.to/");

	app.whenReady().then(() => {
		globalShortcut.register("CommandOrControl+Shift+I", () => {
			mainWindow.webContents.openDevTools();
		});
		globalShortcut.register("CommandOrControl+Q", () => {
			app.quit();
		});
		globalShortcut.register("F11", () => {
			fullscreen();
		});
		globalShortcut.register("CommandOrControl+H", () => {
			mainWindow.loadURL("https://4anime.to/");
		});
		tray = new Tray(path.join(__dirname, "assets/logo.ico"));
		tray.setToolTip("a simple desktop client for 4anime.to");

		image = nativeImage.createFromPath(path.join(__dirname, "assets/logo.png"));
		image.resize({
			width: 16,
			height: 16,
		});

		let trayMenu = Menu.buildFromTemplate([
			{ label: "4anime" },
			{ type: "separator" },
			{
				label: "Quit",
				click: () => {
					app.quit();
				},
			},
		]);

		tray.setContextMenu(trayMenu);
	});
};

function updateDiscordRPC() {
	const client = require("discord-rich-presence")("748654462121410740");
	let nowWatching = mainWindow.webContents.getURL();

	client.on("connected", () => {
		console.log("connected!");
	});

	client.updatePresence({
		state: "Watchin Anime",
		details: `watching ${nowWatching}`,
		largeImageKey: "logo",
		instance: true,
	});
}

function createMenu() {
	const template = [
		{
			label: "Exit",
			click: async () => {
				app.quit();
			},
		},
		{
			label: "Home",
			click: () => {
				console.log("Home Clicked");
				mainWindow.loadURL("https://4anime.to/");
			},
		},
		{
			label: "Toggle Full Screen",
			click: () => {
				fullscreen();
			},
		},

		{
			label: "Check For Updates",
			click: () => {
				console.log("chk4updates");
				dialog.showMessageBox({
					title: "Check For Updates",
					message: "Updates is still a work in progress",
				});
			},
		},
	];

	menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

function fullscreen() {
	if (BrowserWindow.getFocusedWindow().isFullScreen()) {
		BrowserWindow.getFocusedWindow().setFullScreen(false);
		createMenu();
	} else {
		BrowserWindow.getFocusedWindow().setFullScreen(true);
	}
}

app.on("ready", () => {
	//getUpdate();
	createSplash();
	createWindow();
	createMenu();

	setInterval(updateDiscordRPC, 15600);
	process.on("unhandledRejection", console.error);

	ipcMain.on("Downloaded", () => {
		mainSplash.close();
		mainWindow.show();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
