import React, { useState, useEffect } from "react";
import { configService } from "../../app-integration/API.js";
import "../../assets/css/LicenseKeyInfo.css";

const LicenseKeyInfo = ({ userEmail }) => {
    const [license, setLicense] = useState("");
    const [serial, setSerial] = useState("");
    const [error, setError] = useState("");
    const [showFullKey, setShowFullKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch license from backend
    useEffect(() => {
        const fetchLicense = async () => {
            try {
                setLoading(true);
                const service = await configService();
                const res = await service.getUserLicense(userEmail);

                // Ensure license is a string
                const licenseString = typeof res === "string" ? res : res?.data ?? "";
                setLicense(licenseString);
            } catch (err) {
                console.error("Failed to fetch license:", err);
                setLicense("");
            } finally {
                setLoading(false);
            }
        };

        if (userEmail) fetchLicense();
    }, [userEmail]);


    // Masked license (last 4 chars visible)
    const maskedKey = license ? "*".repeat(license.length - 4) + license.slice(-4) : "";

    const handleChange = (e) => {
        let input = e.target.value;
        input = input.replace(/[\W\s._-]+/g, "");

        let split = 4;
        const chunk = [];
        for (let i = 0; i < input.length; i += split) {
            split = i >= 8 && i <= 16 ? 4 : 8;
            chunk.push(input.substr(i, split));
        }

        const formatted = chunk.join("-").toUpperCase();
        setSerial(formatted);

        if (!/^[A-Z0-9-]*$/.test(formatted)) {
            setError("Only alphanumeric characters are allowed");
        } else {
            setError("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitized = serial.replace(/[($)\s._-]+/g, "");
        if (sanitized.length < 16) {
            setError("Serial number is too short");
            return;
        }
        alert("License key submitted successfully!");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(license);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // reset after 2s
        } catch (err) {
            console.error("Failed to copy license key:", err);
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this license?")) {
            alert("License deleted successfully!");
        }
    };

    if (loading) {
        return <div className="license-details-info-container">Loading license...</div>;
    }

    return (
        <div className="license-details-info-container">
            {license ? (
                <div className="license-details-info-display">
                    <label className="license-details-info-label">
                        {userEmail} License
                    </label>

                    <div className="license-details-info-key-box">
                        <span className="license-details-info-license-text">
                            {showFullKey ? license : maskedKey}
                        </span>
                        <button
                            type="button"
                            className="license-details-info-toggle-btn"
                            onClick={() => setShowFullKey((prev) => !prev)}
                        >
                            {showFullKey ? "Hide" : "Show"}
                        </button>
                    </div>

                    <div className="license-details-info-actions">
                        <button
                            className={`license-details-info-revoke-btn ${copied ? "copied" : ""}`}
                            onClick={handleCopy}
                        >
                            {copied ? "Copied!" : "Copy License"}
                        </button>
                        <button
                            className="license-details-info-delete-btn"
                            onClick={handleDelete}
                        >
                            Delete License
                        </button>
                    </div>
                </div>
            ) : (
                <form
                    id="license-details-info-form"
                    className="license-details-info-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="serial" className="license-details-info-label">
                        Enter Serial Number
                    </label>
                    <input
                        id="serial"
                        name="serial"
                        type="text"
                        placeholder="e.g. SHDF3884-AEUR-D374-XXXX-XXXXXXXX"
                        maxLength={32}
                        className={`license-details-info-input ${error ? "error" : ""}`}
                        value={serial}
                        onChange={handleChange}
                    />
                    {error && (
                        <label className="license-details-info-error-label">{error}</label>
                    )}
                    <small className="license-details-info-small">
                        Alphanumeric. Dashes will be added automatically.
                    </small>

                    <button type="submit" className="license-details-info-submit-btn">
                        Submit
                    </button>
                </form>
            )}
        </div>
    );
};

export default LicenseKeyInfo;
