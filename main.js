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
	clipboard,
	shell,
} = require("electron");
const path = require("path");
const request = require("request");
const fs = require("fs");
const ElectronBlocker = require("@cliqz/adblocker-electron");
require("update-electron-app")();

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
let contents;

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

setTimeout(downloadNoArgs, 2000);

const createSplash = () => {
	mainSplash = new BrowserWindow({
		width: 400,
		height: 450,
		icon: path.join(__dirname, "assets/logo.png"),
		resizable: false,
		movable: true,
		autoHideMenuBar: true,
		opacity: 0.98,
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
		autoHideMenuBar: false,
		resizable: true,
		center: true,
		show: false,
	});

	contents = mainWindow.webContents;

	mainWindow.loadURL("https://4anime.to/");

	blocker = ElectronBlocker.ElectronBlocker.parse(
		fs.readFileSync(path.join(__dirname, "assets/EasyList.txt"), "utf-8")
	);
	blocker.enableBlockingInSession(session.defaultSession);

	mainWindow.loadURL("https://4anime.to/");
	console.log(contents.getURL());
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
		globalShortcut.register("CommandOrControl+R", () => {
			mainWindow.reload();
		});
		globalShortcut.register("F5", () => {
			mainWindow.reload();
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

function getCurrentUrl() {
	return contents.getURL();
}

function disableMenu() {
	Menu.setApplicationMenu(null);
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
			label: "Copy link",
			click: () => {
				clipboard.writeText(getCurrentUrl());
			},
		},
		{
			label: "Open In Browser",
			click: () => {
				shell.openExternal(getCurrentUrl());
			},
		},
		{
			label: "Refresh",
			click: () => {
				mainWindow.reload();
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
				shell.openExternal(
					"https://github.com/Xart3mis/4anime-app/releases/latest"
				);
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
	require("./src/Scripts/rpc")();
	//getUpdate();
	createSplash();
	createWindow();
	createMenu();
	mainWindow.webContents.on("new-window", (event, url) => {
		var hostname = new URL(url).hostname.toLowerCase();
		if (hostname.indexOf("discord.gg") !== -1) {
			shell.openExternal("https://" + "discord.gg" + "/" + "Yfb6JVe");
		}
		if (hostname.indexOf("disqus.com") !== -1) {
			dialog.showMessageBox(mainWindow, {
				type: "info",
				title: "disqus",
				message:
					"disqus logins are not supported, please open it in browser if you would like to comment",
			});
			event.preventDefault();
		} else {
			event.preventDefault();
		}
	});

	ipcMain.on("Downloaded", () => {
		mainSplash.close();
		setTimeout(() => {
			mainWindow.show();
		}, 5000);
	});

	mainWindow.on("enter-full-screen", () => {
		disableMenu();
	});
	mainWindow.on("leave-full-screen", () => {
		createMenu();
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

app.on("enter-full-screen", () => {
	disableMenu();
});
