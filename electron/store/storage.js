// src/store/storage.js (main process only)
import keytar from 'keytar';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const SERVICE_NAME = "QueryGrid.io";
const CONFIG_FILE = path.join(app.getPath("userData"), "ipconfig.json");

/* ---------------- Credentials (secure storage via keytar) ---------------- */
export async function saveCredentials(username, token) {
    try {
        return await keytar.setPassword(SERVICE_NAME, username, token);
    } catch (err) {
        console.error("Failed to save credentials:", err);
    }
}

export async function getCredentials(username) {
    try {
        return await keytar.getPassword(SERVICE_NAME, username);
    } catch (err) {
        console.error("Failed to get credentials:", err);
        return null;
    }
}

export async function deleteCredentials(username) {
    try {
        return await keytar.deletePassword(SERVICE_NAME, username);
    } catch (err) {
        console.error("Failed to delete credentials:", err);
    }
}

/* ---------------- Config (plain JSON, non-sensitive) ---------------- */
export function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf8' });
    } catch (err) {
        console.error("Failed to save config:", err);
    }
}

export function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_FILE, { encoding: 'utf8' }));
    } catch (err) {
        console.error("Failed to load config:", err);
        return {};
    }
}

/* ---------------- Reset config (delete server IP / all config) ---------------- */
export function resetConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            fs.unlinkSync(CONFIG_FILE); // delete the config file completely
        }
    } catch (err) {
        console.error("Failed to reset config:", err);
    }
}
