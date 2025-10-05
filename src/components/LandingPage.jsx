// LandingPage.jsx
import React, { useState, useEffect } from "react";
import LoginPage from "./Pages/LoginPage.jsx";
import { userAuthenticationService } from "../app-integration/API.js";
import NotificationAlert from "./UI/NotificationAlert.jsx";

const PostAppSetup = ({ onSetupComplete }) => {
    const [serverIP, setServerIP] = useState("");
    const [notification, setNotification] = useState({ type: "", message: "", timeout: 3000 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ip = serverIP.trim() === "" ? "localhost" : serverIP.trim();

        if (window?.electronAPI?.saveIP) {
            window.electronAPI.saveIP(ip);
        }

        try {
            const authService = await userAuthenticationService();
            const response = await authService.test();

            // Trigger toast notification
            setNotification({ type: "success", message: response.data, timeout: 3000 });

            setTimeout(() => {
                onSetupComplete(ip);
            }, 3100);
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            setNotification({ type: "error", message: error.response?.data || error.message, timeout: 3000 });
        }
    };

    return (
        <section className="login-container">
            <div className="login-form">
                <div className="login-form-content">
                    <header className="login-header">Setup App Server</header>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-field login-input-filed">
                            <input
                                type="text"
                                className="login-input login-repo"
                                placeholder="Host of server"
                                value={serverIP}
                                onChange={(e) => setServerIP(e.target.value)}
                            />
                        </div>
                        <div className="login-field login-button-field">
                            <button type="submit" className="login-btn">
                                Setup & Test Connection
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Render NotificationAlert for displaying toast */}
            {notification.message && (
                <NotificationAlert
                    type={notification.type}
                    message={notification.message}
                    timeout={notification.timeout}
                />
            )}
        </section>
    );
};

export function LandingPage() {
    const [isServerSet, setIsServerSet] = useState(false);
    const [serverIP, setServerIP] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (window?.electronAPI?.getConfig) {
                const cfg = await window.electronAPI.getConfig();
                if (!mounted) return;
                if (cfg?.serverIP) {
                    setServerIP(cfg.serverIP);
                    setIsServerSet(true);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleSetupComplete = (ip) => {
        setServerIP(ip);
        setIsServerSet(true);
    };

    return isServerSet ? (
        <LoginPage />
    ) : (
        <PostAppSetup onSetupComplete={handleSetupComplete} />
    );
}
