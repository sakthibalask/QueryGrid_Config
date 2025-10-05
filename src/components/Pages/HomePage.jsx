import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import '../../assets/css/HomePage.css';
import ConfigMatrix from "../UI/ConfigMatrix.jsx";
import NotificationAlert from "../UI/NotificationAlert.jsx";
import { userService as userServiceAPI, userAuthenticationService } from "../../app-integration/API.js";

const HomePage = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navRef = useRef(null);
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [notification, setNotification] = useState({ type: "", message: "", timeout: 3000 });

    // Token validator
    async function isValidToken(token) {
        try {
            const authService = await userAuthenticationService();
            const res = await authService.tokenValidation(token);
            return res.data;
        } catch (err) {
            return false;
        }
    }

    // Pre-login check on mount
    useEffect(() => {
        (async () => {
            if (window?.electronAPI?.getConfig) {
                const cfg = await window.electronAPI.getConfig();
                if (cfg?.username) {
                    const savedUser = cfg.username;
                    const token = await window.electronAPI.getAuth(savedUser);
                    if (token && await isValidToken(token)) {
                        setUsername(savedUser); // session is valid, continue
                    } else {
                        // Invalid session → clear locally, no logout API call
                        if (window?.electronAPI?.logout) {
                            await window.electronAPI.logout(savedUser);
                        }
                        setUsername('');
                        sessionStorage.removeItem("username");
                        setNotification({
                            type: "warning",
                            message: "Session expired. Please login again.",
                            timeout: 2000
                        });
                        setTimeout(() => navigate("/"), 2200);
                    }
                } else {
                    navigate("/"); // no username stored → redirect
                }
            }
        })();
    }, [navigate]);

    const toggleDropdown = (menu) => {
        setActiveDropdown((prev) => (prev === menu ? null : menu));
    };

    const handleLogout = async () => {
        if (!username) return;

        try {
            const userService = await userServiceAPI();
            await userService.logout(); // backend logout
            // if backend logout succeeds
            if (window?.electronAPI?.logout) {
                await window.electronAPI.logout(username);
            }
            setUsername('');
            sessionStorage.removeItem('username');

            setNotification({ type: "success", message: "Logged out successfully", timeout: 2000 });
            setTimeout(() => navigate('/'), 2100);

        } catch (err) {
            console.error('Logout error:', err);

            // if backend says session already invalid / expired → treat it as expire
                if (window?.electronAPI?.logout) {
                    await window.electronAPI.logout(username);
                }
                setUsername('');
                sessionStorage.removeItem('username');

                setNotification({
                    type: "warning",
                    message: "Session expired. Please login again.",
                    timeout: 2000
                });
                setTimeout(() => navigate('/'), 2200);
        }
    };


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
                    <div className="q2-brand">
                        <a className="q2-logo">QueryGrid Config</a>
                    </div>
                    <div className="q2-nav">
                        <ul className="nav-list">
                            <li className="nav-item">
                                <a
                                    className="nav-item_link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleDropdown("file");
                                    }}
                                >
                                    File
                                </a>
                                <ul
                                    className="nav-dropdown"
                                    style={{
                                        display: activeDropdown === "file" ? "block" : "none",
                                    }}
                                >
                                    <li className="nav-dropdown-item">
                                        <a className="nav-dropdown-item_link">Import Configuration</a>
                                    </li>
                                    <li className="nav-dropdown-item">
                                        <a className="nav-dropdown-item_link">Export Configuration</a>
                                    </li>
                                    <li className="nav-dropdown-item">
                                        <a
                                            className="nav-dropdown-item_link"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li className="nav-item"><a className="nav-item_link">Users</a></li>
                            <li className="nav-item"><a className="nav-item_link">Groups</a></li>
                            <li className="nav-item"><a className="nav-item_link">Repos</a></li>
                            <li className="nav-item"><a className="nav-item_link">Clients</a></li>
                            <li className="nav-item">
                                <a
                                    className="nav-item_link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleDropdown("updates");
                                    }}
                                >
                                    Updates
                                </a>
                                <ul
                                    className="nav-dropdown"
                                    style={{
                                        display: activeDropdown === "updates" ? "block" : "none",
                                    }}
                                >
                                    <li className="nav-dropdown-item">
                                        <a className="nav-dropdown-item_link">Config Updates</a>
                                    </li>
                                    <li className="nav-dropdown-item">
                                        <a className="nav-dropdown-item_link">Client Updates</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <section className="q2-homepage-section">
                <ConfigMatrix />
                {notification.message && (
                    <NotificationAlert
                        type={notification.type}
                        message={notification.message}
                        timeout={notification.timeout}
                    />
                )}
            </section>
        </>
    );
};

export default HomePage;
