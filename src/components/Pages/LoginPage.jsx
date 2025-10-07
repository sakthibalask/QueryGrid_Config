import React, { useState, useEffect } from "react";
import { userAuthenticationService } from "../../app-integration/API.js";
import "../../assets/css/LoginPage.css";
import NotificationAlert from "../UI/NotificationAlert.jsx";

const LoginPage = ({ onLogin }) => {
    const [repo, setRepo] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [notification, setNotification] = useState({ type: "", message: "", timeout: 3000 });
    const [loading, setLoading] = useState(false);
    const [tokenChecked, setTokenChecked] = useState(false);

    const togglePasswordVisibility = () => setShowPassword((p) => !p);

    // ✅ Auto check for existing token on app start
    useEffect(() => {
        const validateToken = async () => {
            try {
                const authData = await window?.electronAPI?.loadAuth?.();
                if (!authData?.token) {
                    setTokenChecked(true);
                    return;
                }

                const authService = await userAuthenticationService();
                const res = await authService.tokenValidation(authData.token);

                if (res?.data === true) {
                    setNotification({
                        type: "info",
                        message: "Revoking previous session...",
                        timeout: 2000,
                    });

                    // Wait briefly then continue login
                    setTimeout(() => {
                        if (typeof onLogin === "function") {
                            onLogin(authData.username);
                        }
                    }, 1500);
                } else {
                    setNotification({
                        type: "warning",
                        message: "Session expired. Please log in again.",
                        timeout: 3000,
                    });
                }
            } catch (err) {
                console.error("Token validation error:", err);
                setNotification({
                    type: "error",
                    message: "Failed to validate session.",
                    timeout: 3000,
                });
            } finally {
                setTokenChecked(true);
            }
        };

        validateToken();
    }, [onLogin]);

    // ✅ Handle login manually
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!repo || !username || !password) {
            setNotification({ type: "warning", message: "Enter all details...", timeout: 2000 });
            return;
        }

        setLoading(true);

        try {
            const authService = await userAuthenticationService();
            const response = await authService.login({
                repositoryName: repo,
                loginName: username,
                password,
            });

            const token = response?.data?.token;
            const message = response?.data?.message || "Login response";

            if (token && token !== "No Token") {
                // Save token to electron store
                if (window?.electronAPI?.saveAuth) {
                    await window.electronAPI.saveAuth({ username, token });
                }

                if (window?.electronAPI?.saveUser) {
                    window.electronAPI.saveUser(username);
                }

                setNotification({ type: "success", message: message, timeout: 2000 });

                if (typeof onLogin === "function") {
                    setTimeout(() => onLogin(username), 1200);
                }

                setRepo("");
                setUsername("");
                setPassword("");
            } else {
                setNotification({
                    type: "error",
                    message: message || "Login failed",
                    timeout: 3000,
                });
                setRepo("");
                setUsername("");
                setPassword("");
            }
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            setNotification({
                type: "error",
                message: err.response?.data || err.message || "Login failed",
                timeout: 3000,
            });
            setRepo("");
            setUsername("");
            setPassword("");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Reset server configuration
    const resetConfig = async () => {
        try {
            const result = await window.electronAPI.resetServer();
            if (result?.success) {
                setNotification({
                    type: "success",
                    message: "Server config reset successfully!",
                    timeout: 2000,
                });
                setTimeout(() => window.location.reload(), 900);
            } else {
                setNotification({
                    type: "error",
                    message: "Failed to reset server",
                    timeout: 3000,
                });
            }
        } catch (err) {
            console.error("Reset server error:", err);
            setNotification({ type: "error", message: "Reset failed", timeout: 3000 });
        }
    };

    // Show nothing until token validation completes
    if (!tokenChecked) return null;

    return (
        <>
            <section className="login-container">
                <div className="login-form">
                    <div className="login-form-content">
                        <header className="login-header">Login</header>
                        <form className="login-form" onSubmit={handleLogin}>
                            <div className="login-field login-input-filed">
                                <input
                                    type="text"
                                    className="login-input login-repo"
                                    placeholder="Repository"
                                    value={repo}
                                    onChange={(e) => setRepo(e.target.value)}
                                />
                            </div>

                            <div className="login-field login-input-filed">
                                <input
                                    type="text"
                                    className="login-input login-username"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="login-field login-input-filed" style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="login-input login-password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i
                                    className={`form-icon ${showPassword ? "ri-eye-line" : "ri-eye-off-line"}`}
                                    onClick={togglePasswordVisibility}
                                    style={{
                                        cursor: "pointer",
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                    }}
                                ></i>
                            </div>

                            <div className="login-form-link login-form-forgot">
                                <span className="login-forgot">
                                    Forgot Password{" "}
                                    <a href="#" className="login-forgot-pass">
                                        [Click Here]
                                    </a>
                                </span>
                            </div>

                            <div className="login-form-link login-form-forgot">
                                <span className="login-forgot">
                                    Reset Server{" "}
                                    <a className="login-forgot-pass" onClick={resetConfig}>
                                        [Click Here]
                                    </a>
                                </span>
                            </div>

                            <div className="login-field login-button-field">
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {notification.message && (
                <NotificationAlert
                    type={notification.type}
                    message={notification.message}
                    timeout={notification.timeout}
                />
            )}
        </>
    );
};

export default LoginPage;
