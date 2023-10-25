// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const AutoLaunch = require("auto-launch");
require('@electron/remote/main').initialize()

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    })

    // Enable remote module in the main window WebContents.
    require("@electron/remote/main").enable(mainWindow.webContents);

    // and load the index.html of the app.
    mainWindow.loadFile('src/index.html')

    ipcMain.on('screen-share-selected', (event, message) => {
        mainWindow.webContents.send('screen-share-ready', message);
    });
}
// const myFunction = ()=>{
//         const desktopCapturer = require("electron").desktopCapturer
//         const ipcRenderer = require('electron').ipcRenderer;
//         let availableScreens = [];
//
//         desktopCapturer.getSources({
//             types: ['window', 'screen']
//         }).then(async sources => {
//             sources.forEach(source => {
//                 availableScreens.push(source);
//             });
//         });
//         ipcRenderer.send('screen-share-selected', availableScreens[0].id);
// }
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // myFunction()

    // mainWindow.webContents.on('did-finish-load', () => {
    //     // const desktopCapturer = require('@electron/remote/main').desktopCapturer;
    //     // let availableScreens = [];
    //     //
    //     // desktopCapturer.getSources({
    //     //     types: ['window', 'screen']
    //     // }).then(async sources => {
    //     //     sources.forEach(source => {
    //     //         availableScreens.push(source);
    //     //     });
    //     // });
    //     // mainWindow.webContents.send('screen-share-selected', availableScreens[0].id);
    //     alert("jjajaja")
    // });
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
})

app.on("ready", function(){
    let autoLaunch = new AutoLaunch({
        name: 'Your app name goes here',
        path: app.getPath('exe'),
    });
    autoLaunch.isEnabled().then((isEnabled) => {
        if (!isEnabled) autoLaunch.enable();
    });
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.