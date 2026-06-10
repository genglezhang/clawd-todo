const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('patAPI', {
  sendPat: () => ipcRenderer.send('pat-triggered'),
});
