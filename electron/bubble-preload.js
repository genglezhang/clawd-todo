const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bubbleAPI', {
  onShow:      (cb) => ipcRenderer.on('bubble-show', (_, text) => cb(text)),
  onHide:      (cb) => ipcRenderer.on('bubble-hide', () => cb()),
  reportSize:  (w, h) => ipcRenderer.send('bubble-size', { w, h }),
});
