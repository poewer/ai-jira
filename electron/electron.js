const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // pamiętaj o zabezpieczeniach – tylko dla dewelopmentu!
      // preload: path.join(__dirname, 'preload.js'), // opcjonalnie, jeśli potrzebujesz
    },
  });

  win.loadURL('http://localhost:3000');
//   if (process.env.NODE_ENV === 'development') {
//     // Ładujemy adres serwera Vite (np. http://localhost:3000)
//     win.loadURL('http://localhost:3000');
//   } else {
//     // Ładujemy statyczne pliki z folderu build (np. dist)
//     win.loadFile(path.join(__dirname, '../dist/index.html'));
//   }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
