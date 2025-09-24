// electron/preload.js  (CommonJS)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // send-only
    saveIP: (ip) => ipcRenderer.send('save-ip', { serverIp: ip }),
    saveAuth: (payload) => ipcRenderer.send('save-auth', payload),
    logout: (username) => ipcRenderer.send('logout', { username }),

    // request/response
    getConfig: () => ipcRenderer.invoke('get-config'),

    resetServer: () => ipcRenderer.invoke("reset-server")
});
