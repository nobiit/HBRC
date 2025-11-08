const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('headless');
app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('site-per-process');
app.whenReady().then(async () => {
  await Promise.all(new Array(10).fill(0).map(async () => {
    const w = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: false,
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    await w.loadURL('https://example.com');
    console.log('Loaded:', await w.webContents.executeJavaScript('document.title'));
    console.log('Renderer pid:', w.webContents.getOSProcessId());
  }));
  // app.quit();
});
