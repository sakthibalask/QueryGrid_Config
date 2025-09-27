import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAuthenticationService } from "../../app-integration/API.js";
import '../../assets/css/LoginPage.css';

const LoginPage = ({ serverIP }) => {
    const [repo, setRepo] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                if (window?.electronAPI?.getConfig) {
                    const cfg = await window.electronAPI.getConfig();
                    const savedUser = cfg?.username;
                    if (savedUser && window?.electronAPI?.getAuth) {
                        const token = await window.electronAPI.getAuth(savedUser);
                        if (token) {
                            nav("/config");
                        }
                    }
                }
            } catch (err) {
                console.error("Auto-login failed:", err);
            }
        })();
    }, [nav]);


    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!repo || !username || !password) {
            alert("Enter all details...");
            return;
        }

        const authService = userAuthenticationService(serverIP);
        try {
            const response = await authService.login({ repositoryName: repo, loginName: username, password });

            if (window?.electronAPI?.saveAuth) {
                await window.electronAPI.saveAuth({ username, token: response.data.token });
                // sessionStorage.setItem("username", username);
                if (window?.electronAPI?.saveUser) window.electronAPI.saveUser(username);
                alert(response.data.message);
                if(response.data.token!=="No Token"){
                    nav("/config");
                }else{
                    e.preventDefault();
                }

            }
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
        } finally {
            setRepo('');
            setUsername('');
            setPassword('');
        }
    };

    const resetConfig = async () => {
        try {
            const result = await window.electronAPI.resetServer();
            if (result.success) {
                alert("Server config reset successfully!");
                setRepo('');
                setUsername('');
                setPassword('');
                window.location.reload();
            } else {
                alert("Failed to reset server: " + result.error);
            }
        } catch (err) {
            console.error("Reset server error:", err);
        }
    };

    return (
        <section className="login-container">
            <div className="login-form">
                <div className="login-form-content">
                    <header className="login-header">Login</header>
                    <form className="login-form">
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
                                    transform: "translateY(-50%)"
                                }}
                            ></i>
                        </div>

                        <div className="login-form-link login-form-forgot">
                            <span className="login-forgot">
                                Forgot Password <a href="#" className="login-forgot-pass">[Click Here]</a>
                            </span>
                        </div>

                        <div className="login-form-link login-form-forgot">
                            <span className="login-forgot">
                                Reset Server <a className="login-forgot-pass" onClick={resetConfig}>[Click Here]</a>
                            </span>
                        </div>

                        <div className="login-field login-button-field">
                            <button type="button" className="login-btn" onClick={handleLogin}>
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;
