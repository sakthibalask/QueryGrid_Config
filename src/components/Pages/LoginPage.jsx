import { useState } from "react";
import '../../assets/css/LoginPage.css';
import fs from "fs";

const LoginPage = ({ serverIP }) => {
    const [repo, setRepo] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
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
            console.error(err);
        }
    };


    return (
        <>
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
                                    style={{ cursor: "pointer", position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                                ></i>
                            </div>

                            <div className="login-form-link login-form-forgot">
                                <span className="login-forgot">
                                    Forgot Password <a href="#" className="login-forgot-pass">[Click Here]</a>
                                </span>
                            </div>

                            <div className="login-form-link login-form-forgot">
                                <span className="login-forgot">
                                    Reset Server <a className="login-forgot-pass" onClick={()=>resetConfig()}>[Click Here]</a>
                                </span>
                            </div>

                            <div className="login-field login-button-field">
                                <button type="button" className="login-btn">Login</button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </>
    );
};

export default LoginPage;
