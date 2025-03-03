const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios'); // Użyj axios zamiast fetch

// Globalna zmienna do przechowywania poświadczeń
let jiraCredentials = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.loadURL('http://localhost:3000');
  
  // Otwórz DevTools w trybie deweloperskim
  win.webContents.openDevTools();
}

// Obsługuj wywołania API Jira
ipcMain.handle('jira-api-call', async (event, endpoint, method, data) => {
  console.log(`Wywołanie API: ${method} ${endpoint}`);
  
  if (!jiraCredentials) {
    throw new Error('Brak poświadczeń Jira');
  }
  
  const { email, apiToken, domain } = jiraCredentials;
  const url = `${domain}${endpoint}`;
  
  try {
    const response = await axios({
      url,
      method: method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
      },
      data: data ? data : undefined
    });
    
    return response.data;
  } catch (error) {
    console.error('Błąd wywołania API Jira:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
});

// Przechowuj poświadczenia globalnie
ipcMain.handle('set-jira-credentials', (event, credentials) => {
  jiraCredentials = credentials;
  console.log('Ustawiono poświadczenia Jira');
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});