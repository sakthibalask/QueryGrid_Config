import React, { useState, useEffect } from "react";
import { configService } from "../../app-integration/API.js";
import NotificationAlert from "../UI/NotificationAlert.jsx";

const CreateConfigForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        configName: "",
        dbType: "",
        host: "",
        port: "",
        databaseName: "",
        username: "",
        password: "",
        configType: "",
        groupNames: [],
    });

    const [allGroups, setAllGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);

    // Fetch group names on mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const service = await configService();
                const res = await service.getGroups();
                if (Array.isArray(res.data)) {
                    setAllGroups(res.data);
                } else if (Array.isArray(res.data.groupNames)) {
                    setAllGroups(res.data.groupNames);
                }
            } catch (error) {
                console.error("Error fetching group names:", error);
            }
        };
        fetchGroups();
    }, []);

    // Handle input fields
    const handleInputChange = (e) => {
        const { placeholder, value } = e.target;

        const fieldMap = {
            "Configuration Name": "configName",
            "Database Type": "dbType",
            "Database Host": "host",
            "Database Port": "port",
            "Database Name": "databaseName",
            "Database Username": "username",
            "Database Password": "password",
            "Database Configuration Type": "configType",
        };

        const field = fieldMap[placeholder];
        if (field) setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Search/filter groups
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === "") {
            setFilteredGroups([]);
        } else {
            const filtered = allGroups.filter((group) =>
                group.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredGroups(filtered);
        }
    };

    // Add group from suggestions
    const handleAddGroup = (group) => {
        if (!formData.groupNames.includes(group)) {
            setFormData((prev) => ({
                ...prev,
                groupNames: [...prev.groupNames, group],
            }));
        }
        setSearchTerm("");
        setFilteredGroups([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const service = await configService();
            const response = await service.createConfig(formData);

            // Assuming API response structure like:
            // { message: "Database Configuration Saved Successful", connectionMessage: "ConnectionID-..." }
            const successMsg = response.data.message || "Configuration created successfully!";
            const infoMsg = response.data.connectionMessage || "";

            // Show success notification
            setIsError(false);
            setMessage(successMsg);

            // Show info notification separately if available
            if (infoMsg) {
                setTimeout(() => {
                    NotificationAlert({ type: "info", message: infoMsg, timeout: 4000 });
                }, 500); // small delay so success shows first
            }

            setTimeout(() => {
                setMessage(null);
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Error creating config:", error);
            setIsError(true);
            setMessage("Failed to create configuration. Please try again.");
        }
    };

    const handleRemoveGroup = (groupToRemove) => {
        setFormData((prev) => ({
            ...prev,
            groupNames: prev.groupNames.filter((g) => g !== groupToRemove),
        }));
    };



    return (
        <>
            {message && (
                <NotificationAlert
                    type={isError ? "error" : "success"}
                    message={message}
                    timeout={3000}
                />
            )}


            <div className="form-wrapper">
                <header className="form-header">
                    <h3 className="form-header-title">Create Database Configuration</h3>
                    <span className="form-header-close" onClick={onClose}>
                        <i className="ri-close-large-line"></i>
                    </span>
                </header>

                <form className="config-form" onSubmit={handleSubmit}>
                    <div className="form-field-box">
                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Configuration Name"
                                type="text"
                                value={formData.configName}
                                onChange={handleInputChange}
                            />
                            <i className="ri-file-settings-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Type"
                                type="text"
                                value={formData.dbType}
                                onChange={handleInputChange}
                            />
                            <i className="ri-database-2-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Host"
                                type="text"
                                value={formData.host}
                                onChange={handleInputChange}
                            />
                            <i className="ri-server-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Port"
                                type="text"
                                value={formData.port}
                                onChange={handleInputChange}
                            />
                            <i className="ri-number-0"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Name"
                                type="text"
                                value={formData.databaseName}
                                onChange={handleInputChange}
                            />
                            <i className="ri-database-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Configuration Type"
                                type="text"
                                value={formData.configType}
                                onChange={handleInputChange}
                            />
                            <i className="ri-instance-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Username"
                                type="text"
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                            <i className="ri-user-3-line"></i>
                        </div>

                        <div className="form-field">
                            <input
                                className="form-input-field"
                                placeholder="Database Password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                            <i className="ri-lock-password-line"></i>
                        </div>
                    </div>

                    {/* Group Selection Area */}
                    <div className="group-form-box">
                        <div className="form-field group-form-field">
                            <input
                                className="form-input-field"
                                placeholder="Search Groups...."
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            <i className="ri-search-line"></i>

                            {/* Dropdown suggestions */}
                            {filteredGroups.length > 0 && (
                                <ul className="group-dropdown-list">
                                    {filteredGroups.map((group, idx) => (
                                        <li
                                            key={idx}
                                            className="group-dropdown-item"
                                            onClick={() => handleAddGroup(group)}
                                        >
                                            {group}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="group-field">
                            <div className="group-chips-container">
                                {formData.groupNames.length > 0 ? (
                                    formData.groupNames.map((group, idx) => (
                                        <span key={idx} className="group-chip">
                                            {group}
                                            <i
                                                className="ri-close-line remove-icon"
                                                onClick={() => handleRemoveGroup(group)}
                                                title="Remove group"
                                            ></i>
                                        </span>
                                    ))
                                ) : (
                                    <p className="no-groups-text">No groups added yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-button-area">
                        <button className="form-button" type="submit">
                            Create Config
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CreateConfigForm;
