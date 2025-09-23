import React, { useState } from "react";
import LoginPage from "./Pages/LoginPage.jsx";

const PostAppSetup = ({ onSetupComplete }) => {
    const [serverIP, setServerIP] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSetupComplete(serverIP==="" || "localhost");
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
                                placeholder="IP of server [default: localhost]"
                                value={serverIP}
                                onChange={(e) => setServerIP(e.target.value)}
                            />
                        </div>

                        <div className="login-field login-button-field">
                            <button type="submit" className="login-btn">
                                Setup
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export function LandingPage() {
    const [isServerSet, setIsServerSet] = useState(false);
    const [serverIP, setServerIP] = useState("");

    const handleSetupComplete = (ip) => {
        setServerIP(ip);
        setIsServerSet(true);
    };

    return (
        <>
            {isServerSet ? (
                <LoginPage serverIP={serverIP} />
            ) : (
                <PostAppSetup onSetupComplete={handleSetupComplete} />
            )}
        </>
    );
}
