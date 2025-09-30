import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let storage = null;

const isDev = process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "true";

async function loadStorageModule() {
    if (storage) return storage;
    try {
        storage = await import("./store/storage.js");
        return storage;
    } catch {}
    const appPath = app.getAppPath();
    const candidates = [
        path.join(appPath, "electron", "store", "storage.js"),
        path.join(appPath, "electron", "src", "store", "storage.js"),
        path.join(appPath, "store", "storage.js"),
        path.join(appPath, "src", "store", "storage.js"),
        path.join(appPath, "dist", "store", "storage.js"),
        path.join(appPath, "resources", "app.asar", "src", "store", "storage.js"),
    ];
    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                storage = await import(pathToFileURL(p).href);
                return storage;
            }
        } catch {}
    }
    throw new Error("Could not locate storage module.");
}

function findPreloadPath() {
    const candidates = [
        path.join(__dirname, "preload.js"),
        path.join(__dirname, "../electron/preload.js"),
        path.join(__dirname, "../preload.js"),
        path.join(__dirname, "electron", "preload.js"),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, "preload.js");
}

async function createWindow() {
    try {
        await loadStorageModule();
    } catch {}
    const preloadPath = findPreloadPath();
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
        resizable: true,
        autoHideMenuBar: true,
    });
    mainWindow.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173").catch(() => {});
        if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
        return;
    }
    let savedServer = null;
    let savedUser = null;
    let savedToken = null;
    try {
        if (storage && typeof storage.loadConfig === "function") {
            const cfg = storage.loadConfig();
            savedServer = cfg?.serverIP;
            savedUser = cfg?.username;
            if (savedUser && typeof storage.getCredentials === "function") {
                savedToken = await storage.getCredentials(savedUser);
            }
        }
    } catch {}
    async function safeLoadFile(win, filePath) {
        try {
            await win.loadFile(filePath);
        } catch {
            await win.loadURL(pathToFileURL(filePath).href);
        }
    }
    const setupPath = path.join(__dirname, "../dist/setup.html");
    const homePath = path.join(__dirname, "../dist/home.html");
    const indexPath = path.join(__dirname, "../dist/index.html");
    const useIndex = fs.existsSync(indexPath);
    try {
        if (savedServer && savedToken) {
            if (useIndex) {
                await safeLoadFile(mainWindow, indexPath);
            } else {
                await safeLoadFile(mainWindow, homePath);
            }
        } else {
            if (useIndex) {
                await safeLoadFile(mainWindow, indexPath);
            } else {
                await safeLoadFile(mainWindow, setupPath);
            }
        }
    } catch {
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
}

ipcMain.on("save-ip", (event, { serverIp }) => {
    try {
        if (storage && typeof storage.saveConfig === "function") {
            const cfg = storage.loadConfig ? storage.loadConfig() : {};
            storage.saveConfig({ ...cfg, serverIP: serverIp });
        }
    } catch {}
});

ipcMain.on("save-auth", async (event, { payload }) => {
    try {
        if (storage && typeof storage.saveCredentials === "function") {
            if (payload.username && payload.token) await storage.saveCredentials(payload.username, payload.token);
        }
    } catch {}
});

ipcMain.handle("get-auth", async (event, { username }) => {
    try {
        if (storage && typeof storage.getCredentials === "function") {
            if (username) return await storage.getCredentials(username);
        }
    } catch {}
});

ipcMain.handle("get-config", () => {
    try {
        if (storage && typeof storage.loadConfig === "function") {
            return storage.loadConfig();
        }
        return {};
    } catch {
        return {};
    }
});

ipcMain.handle("reset-server", async () => {
    try {
        if (storage && typeof storage.resetConfig === "function") {
            storage.resetConfig();
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.on("logout", async (event, { username }) => {
    try {
        if (storage && typeof storage.deleteCredentials === "function" && username) {
            await storage.deleteCredentials(username);
        }

        if (storage && typeof storage.loadConfig === "function" && typeof storage.saveConfig === "function") {
            const currentConfig = storage.loadConfig();
            // remove only username, keep other fields (like serverIP)
            const updatedConfig = { ...currentConfig };
            delete updatedConfig.username;

            storage.saveConfig(updatedConfig);
        }
    } catch (err) {
        console.error("Logout error:", err);
    }
});


ipcMain.on("save-user", (event, { username }) => {
    try {
        if (storage && typeof storage.loadConfig === "function" && typeof storage.saveConfig === "function") {
            const cfg = storage.loadConfig() || {};
            cfg.username = username;
            storage.saveConfig(cfg);
        }
    } catch {}
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
    }
});

app.whenReady()
    .then(async () => {
        try {
            await loadStorageModule();
        } catch {}
        await createWindow();
    })
    .catch(() => {});
