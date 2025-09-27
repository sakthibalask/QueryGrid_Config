import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const ConfigMatrix = () => {
    const [token, setToken] = useState("");
    const didFetch = useRef(false);
    const nav = useNavigate();

    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;

        (async () => {
            if (window?.electronAPI?.getConfig && window?.electronAPI?.getAuth) {
                try {
                    const cfg = await window.electronAPI.getConfig();
                    const username = cfg?.username;
                    if (username) {
                        const authToken = await window.electronAPI.getAuth(username);
                        setToken(authToken || "");
                    }
                } catch (err) {
                    console.error("Failed to fetch token:", err);
                }
            }
        })();
    }, []);

    const handleLogout = async () => {
        try {
            if (window?.electronAPI?.getConfig && window?.electronAPI?.logout) {
                const cfg = await window.electronAPI.getConfig();
                const username = cfg?.username;
                if (username) {
                    await window.electronAPI.logout(username);
                }
            }
            nav("/"); // back to login
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <p>Token: {token}</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default ConfigMatrix;
