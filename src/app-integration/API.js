import axios from "axios";

let cachedToken = null;      // Memory cache for token
let cachedServerIP = null;   // Memory cache for serverIP
let cachedAPI = null;        // Memory cache for axios instance

function setDefaultServerURL(serverIP) {
    return `http://${serverIP}:8181/app/v1`;
}

async function getServerIP() {
    if (!cachedServerIP && window?.electronAPI?.getConfig) {
        const cfg = await window.electronAPI.getConfig();
        cachedServerIP = cfg?.serverIP || "localhost";
    }
    return cachedServerIP;
}

async function createAPI() {
    const serverIP = await getServerIP();

    if (cachedAPI && cachedServerIP === serverIP) {
        return cachedAPI; // return cached instance if same serverIP
    }

    const api = axios.create({
        baseURL: setDefaultServerURL(serverIP),
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Attach token to every request
    api.interceptors.request.use(
        async (config) => {
            if (!cachedToken) {
                const username = sessionStorage.getItem("username");
                if (username && window?.electronAPI?.getAuth) {
                    cachedToken = await window.electronAPI.getAuth(username);
                }
            }

            if (cachedToken) {
                config.headers.Authorization = `Bearer ${cachedToken}`;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Handle 401
    api.interceptors.response.use(
        (res) => res,
        async (err) => {
            if (err.response?.status === 401) {
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
            const res = await api.post("/auth/authenticateUser/config", data);
            if (res.data?.token) cachedToken = res.data.token;
            return res;
        },
        tokenValidation: async (token) => api.get("/auth/checkValid?token="+ token),
    };
}

// User service
export async function userService() {
    const api = await createAPI();

    return {
        logout: () => api.post("/users/logout"),
    };
}

export async function configService() {
    const api = await createAPI();

    return {
        getConfigNames: () => api.get("/configuration/getConfigsName"),
        getGroups: ()=> api.get("/configuration/getGroupNames"),
        updateConfig: (data) => api.patch("/configuration/update/config", data),
    }
}

export default createAPI;
