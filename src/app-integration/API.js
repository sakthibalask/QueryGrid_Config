import axios from "axios";

function setDefaultServerURL(serverIp) {
    return `http://${serverIp}:8181/app/v1`;
}

function createAPI(serverIp) {
    const api = axios.create({
        baseURL: setDefaultServerURL(serverIp),
        headers: {
            "Content-Type": "application/json",
        },
    });

    // api.interceptors.request.use(
    //     (config) => {
    //         const token =
    //     }
    // )

    return api;
}

export function userAuthenticationService(serverIp) {
    const api = createAPI(serverIp);

    return {
        test: () => api.get("/auth/test-connection"),
        login: (data) => api.create("/auth/authenticateUser", data)
    }
}

export default createAPI;

