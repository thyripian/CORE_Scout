// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDbFile: () => ipcRenderer.invoke('dialog:openFile'),
    quitApp: () => ipcRenderer.send('app:quit')
});
