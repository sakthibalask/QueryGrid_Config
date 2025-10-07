import React, { useState, useEffect, useRef } from "react";
import '../../assets/css/HomePage.css';
import ConfigMatrix from "../UI/ConfigMatrix.jsx";
import NotificationAlert from "../UI/NotificationAlert.jsx";
import { userService as userServiceAPI, userAuthenticationService } from "../../app-integration/API.js";

const HomePage = ({ onLogout }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [username, setUsername] = useState('');
    const [notification, setNotification] = useState({ type: "", message: "", timeout: 3000 });
    const navRef = useRef(null);

    async function isValidToken(token) {
        try {
            const authService = await userAuthenticationService();
            const res = await authService.tokenValidation(token);
            return !!res.data;
        } catch {
            return false;
        }
    }

    // On initial mount, restore username from Electron if not already set
    useEffect(() => {
        if (username) return; // already set from login

        (async () => {
            try {
                if (!window?.electronAPI?.getConfig) return;

                const cfg = await window.electronAPI.getConfig();
                const savedUser = cfg?.username;

                if (savedUser) {
                    const token = await window.electronAPI.getAuth(savedUser);
                    if (token && await isValidToken(token)) {
                        setUsername(savedUser);
                    }
                }
            } catch (err) {
                console.error("HomePage init error:", err);
            }
        })();
    }, []);

    const toggleDropdown = (menu) => setActiveDropdown(prev => (prev === menu ? null : menu));

    const handleLogout = async () => {
        try {
            const userService = await userServiceAPI();
            await userService.logout();
            setNotification({ type: "success", message: "Logging out...", timeout: null });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            if (typeof onLogout === "function") onLogout();
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <>
            <nav className="q2-homepage-nav" ref={navRef}>
                <div className="nav-container">
                    <div className="q2-brand"><a className="q2-logo">QueryGrid Config</a></div>
                    <div className="q2-nav">
                        <ul className="nav-list">
                            <li className="nav-item">
                                <a className="nav-item_link" onClick={(e) => { e.preventDefault(); toggleDropdown("file"); }}>File</a>
                                <ul className="nav-dropdown" style={{ display: activeDropdown === "file" ? "block" : "none" }}>
                                    <li className="nav-dropdown-item"><a className="nav-dropdown-item_link">Import Configuration</a></li>
                                    <li className="nav-dropdown-item"><a className="nav-dropdown-item_link">Export Configuration</a></li>
                                    <li className="nav-dropdown-item"><a className="nav-dropdown-item_link" onClick={handleLogout}>Logout</a></li>
                                </ul>
                            </li>
                            <li className="nav-item"><a className="nav-item_link">Users</a></li>
                            <li className="nav-item"><a className="nav-item_link">Groups</a></li>
                            {/*<li className="nav-item"><a className="nav-item_link">Plugins</a></li>*/}
                            <li className="nav-item"><a className="nav-item_link">Clients</a></li>
                            <li className="nav-item">
                                <a className="nav-item_link" onClick={(e) => { e.preventDefault(); toggleDropdown("updates"); }}>Updates</a>
                                <ul className="nav-dropdown" style={{ display: activeDropdown === "updates" ? "block" : "none" }}>
                                    <li className="nav-dropdown-item"><a className="nav-dropdown-item_link">Config Updates</a></li>
                                    <li className="nav-dropdown-item"><a className="nav-dropdown-item_link">Client Updates</a></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <section className="q2-homepage-section">
                <ConfigMatrix />
                {notification.message && (
                    <NotificationAlert type={notification.type} message={notification.message} timeout={notification.timeout} />
                )}
            </section>
        </>
    );
};

export default HomePage;
