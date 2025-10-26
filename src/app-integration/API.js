// src/app-integration/API.js
import axios from "axios";

let cachedToken = null;
let cachedServerIP = null;
let cachedAPI = null;

function setDefaultServerURL(serverIP) {
    return `http://${serverIP}:8181/app/v1`;
}

async function getServerIP() {
    if (!cachedServerIP) {
        try {
            if (window?.electronAPI?.getConfig) {
                const cfg = await window.electronAPI.getConfig();
                cachedServerIP = cfg?.serverIP || "localhost";
            } else {
                cachedServerIP = "localhost";
            }
        } catch (err) {
            console.error("getServerIP error:", err);
            cachedServerIP = "localhost";
        }
    }
    return cachedServerIP;
}

async function resolveTokenFromIPC() {
    try {
        if (!window?.electronAPI) return null;
        const cfg = await window.electronAPI.getConfig();
        const username = cfg?.username;
        if (username && window.electronAPI.getAuth) {
            const token = await window.electronAPI.getAuth(username);
            if (token && token.split('.').length === 3) {
                return token;
            } else {
                cachedToken = null;
                if (window.electronAPI.logout) await window.electronAPI.logout(username);
                return null;
            }
        }
        return null;
    } catch (err) {
        console.error("resolveTokenFromIPC error:", err);
        cachedToken = null;
        return null;
    }
}

// ✅ Auth-free axios instance (used for login and test)
async function createAuthAPI() {
    const serverIP = await getServerIP();
    return axios.create({
        baseURL: setDefaultServerURL(serverIP),
        headers: { "Content-Type": "application/json" },
    });
}

// ✅ Token-protected axios instance
async function createAPI() {
    const serverIP = await getServerIP();

    if (cachedAPI && cachedServerIP === serverIP) {
        return cachedAPI;
    }

    const api = axios.create({
        baseURL: setDefaultServerURL(serverIP),
        headers: { "Content-Type": "application/json" },
    });

    // Request interceptor → attach token
    api.interceptors.request.use(
        async (config) => {
            try {
                if (!cachedToken) {
                    const ipcToken = await resolveTokenFromIPC();
                    if (ipcToken) {
                        cachedToken = ipcToken;
                    } else {
                        const username = typeof window !== "undefined" ? sessionStorage.getItem("username") : null;
                        if (username && window?.electronAPI?.getAuth) {
                            const t = await window.electronAPI.getAuth(username);
                            if (t && t.split('.').length === 3) cachedToken = t;
                        }
                    }
                }

                if (cachedToken) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${cachedToken}`;
                }
            } catch (err) {
                console.error("Request interceptor token resolution error:", err);
                cachedToken = null;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor → handle 401
    api.interceptors.response.use(
        (res) => res,
        async (err) => {
            if (err?.response?.status === 401) {
                cachedToken = null;
            }
            return Promise.reject(err);
        }
    );

    cachedAPI = api;
    cachedServerIP = serverIP;
    return api;
}

// ===============================
// Auth service (login isolated)
// ===============================
export async function userAuthenticationService() {
    const api = await createAPI();        // for token validation
    const authApi = await createAuthAPI(); // bare instance for login

    return {
        test: () => authApi.get("/auth/test-connection"),

        login: async (data) => {
            try {
                const res = await authApi.post("/auth/authenticateUser/config", data);
                const token = res.data?.token;

                if (token && token !== "No Token" && token.split('.').length === 3) {
                    cachedToken = token;
                } else {
                    cachedToken = null;
                    if (window?.electronAPI?.saveAuth) {
                        await window.electronAPI.saveAuth({ username: data.loginName, token: null });
                    }
                }

                return res;
            } catch (err) {
                cachedToken = null;
                throw err;
            }
        },

        tokenValidation: async (token) => api.get("/auth/checkValid?token=" + token),
    };
}

// ===============================
// User service
// ===============================
export async function userService() {
    const api = await createAPI();

    return {
        logout: async () => {
            try {
                await api.post("/users/logout");
            } catch (err) {
                console.error("Logout API error:", err);
            } finally {
                cachedToken = null;
            }
        },
    };
}

// ===============================
// Config service
// ===============================
export async function configService() {
    const api = await createAPI();

    return {
        getConfigNames: () => api.get("/configuration/getConfigsName"),
        getGroups: () => api.get("/configuration/getGroupNames"),
        updateConfig: (data) => api.patch("/configuration/update/config", data),
        createConfig: (data) => api.post("/configuration/createConfigs", data),
        importConfig: (file) => {
            const formData = new FormData();
            formData.append("file", file);
            return api.post("/configuration/import/config", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        saveConfig: (reset, data) => api.post("/configuration/save/config?reset="+ reset, data),
        previewExport: () => api.get("/configuration/preview/config"),
        exportConfig: (data) => api.post("/configuration/export/config", data),
        getUsersDetails: () => api.get("/configuration/getUsers"),
        getGroupsDetails: () => api.get("/configuration/getGroups"),
        getUserDetails: (useremail) => api.get("/configuration/getUser?email="+ useremail),
        getGroupDetails: (groupName) => api.get("/configuration/getGroup?groupName="+ groupName),
        getUsernames: () => api.get("/configuration/getUsernames"),
        createUser: (userData) => api.post("/configuration/createUser", userData),
        updateUser: (patchData) => api.patch("/configuration/updateUser", patchData),
        deleteUser: (useremail) => api.delete("/configuration/deleteUser?email="+useremail),
        createGroup: (groupData) => api.post("/configuration/createGroup", groupData),
        updateGroup: (groupData) => api.patch("/configuration/updateGroup", groupData),
        deleteGroup: (groupName) => api.delete("/configuration/deleteGroup?groupName="+groupName),
        allocateLicense: (licenseData) => api.post("/configuration/allocateLicense", licenseData),
        getUserDetail: (useremail) => api.get("/configuration/getUser?email=" + useremail),
        getGroupDetail: (groupname) => api.get("/configuration/getGroup?groupName=" + groupname),
        getUserLicense: (useremail) => api.get("/configuration/getLicense?useremail=" + useremail),
        getDbTables: (configName) => api.get("/configuration/fetchTables?configName="+ configName),
        deleteConfig: (configName) => api.delete("/configuration/delete/config?name="+configName),
        fetchAccessRecords: (configName) => api.get("/users/accessedRecords?configName="+configName),
    };
}

export default createAPI;
