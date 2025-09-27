const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    saveIP: (ip) => ipcRenderer.send("save-ip", { serverIp: ip }),
    saveAuth: (payload) => ipcRenderer.send("save-auth", { payload }),
    saveUser: (username) => ipcRenderer.send("save-user", { username }),
    getAuth: (username) => ipcRenderer.invoke("get-auth", { username }),
    logout: (username) => ipcRenderer.send("logout", { username }),
    getConfig: () => ipcRenderer.invoke("get-config"),
    resetServer: () => ipcRenderer.invoke("reset-server")
});
