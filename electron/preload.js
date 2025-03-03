// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Eksponuje funkcje do procesu renderującego
contextBridge.exposeInMainWorld('electronAPI', {
  callJiraAPI: (endpoint, method, data) => ipcRenderer.invoke('jira-api-call', endpoint, method, data),
  setJiraCredentials: (credentials) => ipcRenderer.invoke('set-jira-credentials', credentials)
});