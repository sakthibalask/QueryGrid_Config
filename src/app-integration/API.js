// src/app-integration/API.js
import axios from "axios";

let cachedToken = null;      // memory cache for token
let cachedServerIP = null;   // memory cache for serverIP
let cachedAPI = null;        // memory cache for axios instance

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
            // validate token format (must have 3 parts)
            if (token && token.split('.').length === 3) {
                return token;
            } else {
                // invalid token — clear it
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

async function createAPI() {
    const serverIP = await getServerIP();

    if (cachedAPI && cachedServerIP === serverIP) {
        return cachedAPI;
    }

    const api = axios.create({
        baseURL: setDefaultServerURL(serverIP),
        headers: { "Content-Type": "application/json" },
    });

    // Attach token to every request
    api.interceptors.request.use(
        async (config) => {
            try {
                if (!cachedToken) {
                    const ipcToken = await resolveTokenFromIPC();
                    if (ipcToken) {
                        cachedToken = ipcToken;
                    } else {
                        // fallback (dev): sessionStorage username
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

    // Handle 401: clear cachedToken so next request will re-resolve
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

// Auth service
export async function userAuthenticationService() {
    const api = await createAPI();

    return {
        test: () => api.get("/auth/test-connection"),

        login: async (data) => {
            try {
                const res = await api.post("/auth/authenticateUser/config", data);

                const token = res.data?.token;
                if (token && token !== "No Token" && token.split('.').length === 3) {
                    cachedToken = token;
                } else {
                    cachedToken = null;
                    // clear electron stored token if invalid
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

// User service
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

// Config service
export async function configService() {
    const api = await createAPI();

    return {
        getConfigNames: () => api.get("/configuration/getConfigsName"),
        getGroups: () => api.get("/configuration/getGroupNames"),
        updateConfig: (data) => api.patch("/configuration/update/config", data),
        createConfig: (data) => api.post("/configuration/createConfigs", data),
    };
}

export default createAPI;
