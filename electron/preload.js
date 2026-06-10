const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Task data
  readData:       ()        => ipcRenderer.invoke('read-data'),
  writeData:      (data)    => ipcRenderer.invoke('write-data', data),
  // App settings
  readSettings:   ()        => ipcRenderer.invoke('read-settings'),
  writeSettings:  (patch)   => ipcRenderer.invoke('write-settings', patch),
  // History
  readHistory:    ()        => ipcRenderer.invoke('read-history'),
  writeHistory:   (data)    => ipcRenderer.invoke('write-history', data),
  // Startup at login
  getStartup:     ()        => ipcRenderer.invoke('get-startup'),
  setStartup:     (enable)  => ipcRenderer.invoke('set-startup', enable),
  // Window controls
  minimize:       ()        => ipcRenderer.send('minimize-window'),
  close:          ()        => ipcRenderer.send('close-window'),
  setOpacity:     (value)   => ipcRenderer.invoke('set-opacity', value),
  // Clawd desktop pet
  sendClawdEvent: (body)    => ipcRenderer.invoke('clawd-event', body),
  // Speech bubble
  showBubble:     (opts)    => ipcRenderer.invoke('show-bubble', opts),
});
