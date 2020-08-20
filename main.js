const { app, BrowserWindow, Menu, globalShortcut, session, ipcMain, Tray} = require('electron');
const path = require('path');
const request = require('request')
const fs = require('fs');
const ElectronBlocker = require('@cliqz/adblocker-electron');
const { autoUpdater } = require("electron-updater")

let mainWindow;
let mainSplash;
let Downloaded = false;

if (require('electron-squirrel-startup')) app.quit();


require('update-electron-app')({
    repo: 'Xart3mis/4anime-app',
})//for autoUpdates


const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        try{
            request(url).pipe(fs.createWriteStream(path)).on('close', callback)
        }
        catch{
            console.log('Internet Connection error')
            ipcMain.emit('download-err')
        }
    })
}


const ezListUrl = 'https://easylist-downloads.adblockplus.org/easylist.txt'
const ezListPath = path.join(__dirname, 'assets/EasyList.txt')

function downloadNoArgs(){
    download(ezListUrl, ezListPath, () => {
        console.log('Done!')
        Downloaded = true;
        ipcMain.emit('Downloaded')
    });
}

setTimeout(downloadNoArgs, 1200)

const createSplash= () => {
    mainSplash = new BrowserWindow({
        width: 400,
        height: 450,
        icon: path.join(__dirname, 'assets/logo.png'),
        resizable: false,
        autoHideMenuBar:true,
        center: true,
        alwaysOnTop:true,
        frame:false,
    });

    mainSplash.setMenu(null);

    mainSplash.loadFile(path.join(__dirname, 'src/SplashScreen.html'))
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 960,
        height: 540,
        icon: path.join(__dirname, 'assets/logo.png'),
        minWidth: 480,
        minHeight: 270,
        autoHideMenuBar:true,
        resizable: true,
        center: true,
        show:false
    });
    
    mainWindow.loadURL('https://4anime.to/');

    blocker = ElectronBlocker.ElectronBlocker.parse(fs.readFileSync(path.join(__dirname, 'assets/EasyList.txt'), 'utf-8'))
    blocker.enableBlockingInSession(session.defaultSession);

    mainWindow.loadURL('https://4anime.to/');

    app.whenReady().then(() => {
        globalShortcut.register('CommandOrControl+Q', () => { app.quit(); })
        globalShortcut.register('F11', () => { fullscreen(); })
        globalShortcut.register('CommandOrControl+H', () => { mainWindow.loadURL('https://4anime.to/') })
        tray = new Tray(path.join(__dirname, 'assets/logo.png'))
        tray.setToolTip('a simple desktop client for 4anime.to')
    })
};

function createMenu(){
    const template = [{ label: 'Exit', click: async () => { app.quit(); } }, { label:'Home', click: () => {
        console.log('Home Clicked');
        mainWindow.loadURL('https://4anime.to/')
} },
        {
            label: 'Toggle Full Screen',
            click: () => { fullscreen(); },
        },

        {
            label:'Check For Updates',
            click(){
                autoUpdater.checkForUpdatesAndNotify('A new update is available');
            }
        }

    ];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu)
}

function fullscreen() {
    if (BrowserWindow.getFocusedWindow().isFullScreen()) {
        BrowserWindow.getFocusedWindow().setFullScreen(false);
        createMenu();
    }
    else {
        BrowserWindow.getFocusedWindow().setFullScreen(true);

    }
}

app.on('ready', () => {
    createSplash();
    createWindow();
    createMenu();

    ipcMain.on('Downloaded', () => {
        mainSplash.close();
        mainWindow.show();
        });
    });



app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {

    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


