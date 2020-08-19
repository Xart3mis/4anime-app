const { app, BrowserWindow, Menu, globalShortcut, session} = require('electron');
const path = require('path');
const request = require('request')
const fs = require('fs');
const ElectronBlocker = require('@cliqz/adblocker-electron');

const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

const ezListUrl = 'https://easylist-downloads.adblockplus.org/easylist.txt'
const ezListPath = path.join(__dirname, 'assets/EasyList.txt')


download(ezListUrl, ezListPath, () => {
    console.log('Done!')
})

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 960,
        height: 540,
        icon: path.join(__dirname, 'assets/logo.png'),
        minWidth: 400,
        minHeight: 200,
        autoHideMenuBar:true,
        resizable: true,
        center: true,
    });
    
    
    blocker = ElectronBlocker.ElectronBlocker.parse(fs.readFileSync(path.join(__dirname, 'assets/EasyList.txt'), 'utf-8'))
    blocker.enableBlockingInSession(session.defaultSession);

    mainWindow.loadURL('https://4anime.to/');

    app.whenReady().then(() => {
        globalShortcut.register('CommandOrControl+Q', () => { app.quit(); })
        globalShortcut.register('F11', () => { fullscreen(); })
        globalShortcut.register('CommandOrControl+H', () => { createHome(); })
    })
};

function createHome(){
    BrowserWindow.getFocusedWindow().close()
    createWindow();
}

function createMenu(){
    const template = [{ label: 'Exit', click: async () => { app.quit(); } }, { label:'Home', click: () => {
        console.log('Home Clicked');
        createHome();
} },
        {
            label: 'Toggle Full Screen',
            click: () => { fullscreen(); },
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
    createWindow();
    createMenu();
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


