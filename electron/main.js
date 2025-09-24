// main.js (robust for dev + packaged app)
import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let storage = null; // will hold the dynamically imported storage module

const isDev = process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "true";

/**
 * Try to import storage module.
 *  - First try a relative import (works in dev when files are laid out normally).
 *  - If that fails (packaged app), try several plausible absolute locations relative to app.getAppPath()
 *    and import using file:// URL so it works with app.asar.
 */
async function loadStorageModule() {
    // If already loaded, skip
    if (storage) return storage;

    // Try relative import first (dev)
    try {
        storage = await import("./store/storage.js");
        return storage;
    } catch (err) {
        // swallow and try other locations
    }

    // Must import after app.whenReady() because storage may use app.getPath()
    const appPath = app.getAppPath();

    // candidate paths to check inside packaged app/asar - adjust if you use different layout
    const candidates = [
        path.join(appPath, "electron", "store", "storage.js"),
        path.join(appPath, "electron", "src", "store", "storage.js"),
        path.join(appPath, "store", "storage.js"),
        path.join(appPath, "src", "store", "storage.js"),
        path.join(appPath, "dist", "store", "storage.js"),
        path.join(appPath, "resources", "app.asar", "src", "store", "storage.js"), // unlikely but harmless
    ];

    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                storage = await import(pathToFileURL(p).href);
                return storage;
            }
        } catch (e) {
            // continue
        }
    }

    // as a last resort, attempt to import using a path inside app.asar directly (if you know the internal path)
    // nothing else worked — throw a helpful error
    throw new Error(
        "Could not locate storage module. Looked for ./store/storage.js and several packaged locations. " +
        "Make sure storage.js is included in the packaged app and exported functions are present."
    );
}

/**
 * Resolve preload path robustly. We check several likely locations relative to __dirname.
 */
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
    // fallback: return default relative path (may fail but caller will see error)
    return path.join(__dirname, "preload.js");
}

/**
 * Create the main BrowserWindow and load the appropriate page (dev or packaged)
 */
async function createWindow() {
    // ensure storage module is loaded (storage may use app.getPath internally)
    try {
        await loadStorageModule();
    } catch (err) {
        console.error("Failed to load storage module:", err);
        // Continue — we still need a window so dev can inspect errors; but many features will be broken.
    }

    const preloadPath = findPreloadPath();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
        resizable: false,
        autoHideMenuBar: true,
    });

    // UI preferences
    mainWindow.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);

    if (isDev) {
        // in dev you probably want the Vite server root
        mainWindow.loadURL("http://localhost:5173").catch((err) => {
            console.error("Failed to load dev URL:", err);
        });
        if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
        return;
    }

    // packaged app: decide whether to load home or setup
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
    } catch (err) {
        console.error("Error reading config/credentials from storage:", err);
    }

    // helper to safely load a file, with pathToFileURL fallback (handles spaces & asar)
    async function safeLoadFile(win, filePath) {
        try {
            await win.loadFile(filePath);
        } catch (e) {
            // fallback to encoded file URL
            await win.loadURL(pathToFileURL(filePath).href);
        }
    }

    const setupPath = path.join(__dirname, "../dist/setup.html");
    const homePath = path.join(__dirname, "../dist/home.html");
    const indexPath = path.join(__dirname, "../dist/index.html");

    // prefer SPA index if present
    const useIndex = fs.existsSync(indexPath);

    try {
        if (savedServer && savedToken) {
            // user already set server + has token -> go to app
            if (useIndex) {
                await safeLoadFile(mainWindow, indexPath);
            } else {
                await safeLoadFile(mainWindow, homePath);
            }
        } else {
            // show setup/login
            if (useIndex) {
                await safeLoadFile(mainWindow, indexPath);
            } else {
                await safeLoadFile(mainWindow, setupPath);
            }
        }
    } catch (err) {
        console.error("Error loading UI file:", err);
        // last resort: show an about/error page if you ship one, otherwise open devtools so you can inspect
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
}

/* ----------------- IPC handlers ----------------- */
/**
 * Handlers use the loaded storage module if available. If storage isn't available, they fail gracefully.
 */

ipcMain.on("save-ip", (event, { serverIp }) => {
    try {
        if (storage && typeof storage.saveConfig === "function") {
            const cfg = storage.loadConfig ? storage.loadConfig() : {};
            storage.saveConfig({ ...cfg, serverIP: serverIp });
        } else {
            console.warn("save-ip: storage module not available");
        }
    } catch (err) {
        console.error("save-ip error:", err);
    }
});

ipcMain.on("save-auth", async (event, { username, token, serverIP }) => {
    try {
        if (storage && typeof storage.saveCredentials === "function") {
            if (username && token) await storage.saveCredentials(username, token);
        } else {
            console.warn("save-auth: storage.saveCredentials not available");
        }
        if (storage && typeof storage.saveConfig === "function") {
            const cfg = storage.loadConfig ? storage.loadConfig() : {};
            storage.saveConfig({ ...cfg, username, serverIP });
        }
    } catch (err) {
        console.error("save-auth error:", err);
    }
});

ipcMain.handle("get-config", () => {
    try {
        if (storage && typeof storage.loadConfig === "function") {
            return storage.loadConfig();
        }
        return {};
    } catch (err) {
        console.error("get-config error:", err);
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
        console.error("reset-server error:", err);
        return { success: false, error: err.message };
    }
});


ipcMain.on("logout", async (event, { username }) => {
    try {
        if (storage && typeof storage.deleteCredentials === "function" && username) {
            await storage.deleteCredentials(username);
        }
        // wipe config (you may prefer to only remove username/token but keep serverIP)
        if (storage && typeof storage.saveConfig === "function") {
            storage.saveConfig({});
        }

        // navigate the app back to setup screen
        if (mainWindow) {
            // if SPA index exists, reload it and let SPA route to setup
            const indexPath = path.join(__dirname, "../dist/index.html");
            const setupPath = path.join(__dirname, "../dist/setup.html");
            if (fs.existsSync(indexPath)) {
                await mainWindow.loadFile(indexPath).catch(() => mainWindow.loadURL(pathToFileURL(indexPath).href));
            } else {
                await mainWindow.loadFile(setupPath).catch(() => mainWindow.loadURL(pathToFileURL(setupPath).href));
            }
        }
    } catch (err) {
        console.error("logout error:", err);
    }
});

/* ------------- App lifecycle ------------- */
app.on("window-all-closed", () => {
    // Quit on non-mac platforms
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
    }
});

// load storage after app is ready, then create the window
app.whenReady()
    .then(async () => {
        try {
            await loadStorageModule();
        } catch (err) {
            console.warn("storage module not loaded before createWindow; continuing:", err?.message ?? err);
        }
        await createWindow();
    })
    .catch((err) => {
        console.error("Error during app.whenReady():", err);
    });
