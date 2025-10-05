import React, { useState, useEffect } from "react";
import LoginPage from "./Pages/LoginPage.jsx";
import HomePage from "./Pages/HomePage.jsx";
import PostAppSetup from "./PostAppSetup.jsx";
import { userAuthenticationService } from "../app-integration/API.js";
import NotificationAlert from "./UI/NotificationAlert.jsx";

export function LandingPage() {
    const [isServerSet, setIsServerSet] = useState(false);
    const [checking, setChecking] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [notification, setNotification] = useState({ type: "", message: "", timeout: 3000 });

    // Validate token helper
    async function isValidToken(token) {
        try {
            const authService = await userAuthenticationService();
            const res = await authService.tokenValidation(token);
            return !!res.data;
        } catch {
            return false;
        }
    }

    // On initial mount, check server config and restore user if possible
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                if (!window?.electronAPI?.getConfig) {
                    if (mounted) setIsServerSet(false);
                    return;
                }

                const cfg = await window.electronAPI.getConfig();
                if (!mounted) return;

                setIsServerSet(!!cfg?.serverIP);

                // Only restore session if no user logged in yet
                if (!currentUser && cfg?.username) {
                    const token = await window.electronAPI.getAuth(cfg.username);
                    if (token && await isValidToken(token)) {
                        if (mounted) setCurrentUser(cfg.username);
                    }
                }
            } catch (err) {
                console.error("LandingPage init error:", err);
            } finally {
                if (mounted) setChecking(false);
            }
        })();

        return () => { mounted = false; };
    }, []); // run only once

    // Called when PostAppSetup completes
    const handleSetupComplete = (ip) => setIsServerSet(true);

    // Called by LoginPage after successful login
    const handleLogin = (username) => {
        console.log("handleLogin called with username:", username);
        setNotification({ type: "success", message: `Welcome ${username}`, timeout: 2000 });
        setCurrentUser(username); // React state drives HomePage rendering
    };

    // Called by HomePage on logout
    const handleLogout = async () => {
        try {
            const cfg = await (window?.electronAPI?.getConfig?.() || {});
            const savedUser = cfg?.username;
            if (savedUser && window?.electronAPI?.logout) await window.electronAPI.logout(savedUser);
        } catch (err) {
            console.error("handleLogout error:", err);
        } finally {
            setCurrentUser(null);
            setNotification({ type: "info", message: "Logged out", timeout: 2000 });
        }
    };

    if (checking) return null; // optionally a spinner

    if (!isServerSet) return <PostAppSetup onSetupComplete={handleSetupComplete} />;
    if (currentUser) return <HomePage onLogout={handleLogout} />;

    return <LoginPage onLogin={handleLogin} />;
}
