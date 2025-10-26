import React, { useEffect, useState } from "react";
import "../../assets/css/EditFormView.css";
import { configService } from "../../app-integration/API.js";

const EditFormView = ({ purpose, primaryKey, onClose }) => {
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [modifiedFields, setModifiedFields] = useState({});
    const [service, setService] = useState(null);

    // Initialize API service
    useEffect(() => {
        const initService = async () => {
            const svc = await configService();
            setService(svc);
        };
        initService();
    }, []);

    // Label definitions
    const userLabels = {
        email: "input[type=text]",
        username: "input[type=text]",
        login_name: "input[type=text]",
        repositoryName: "input[type=text]",
        role: "select",
        active: "select", // send as string
    };

    const groupLabels = {
        groupName: "input[type=text]",
        description: "textarea",
        groupRole: "select",
    };

    const labelFields = purpose === "users" ? userLabels : groupLabels;

    const getSelectOptions = (label) => {
        switch (label) {
            case "role":
                return ["ADMINISTRATOR", "SUPERUSER", "COORDINATOR", "USER"];
            case "active":
            case "isLocked":
                return ["true", "false"];
            case "groupRole":
                return ["READER", "WRITER", "EDITOR", "EXECUTOR"];
            default:
                return [];
        }
    };

    // Fetch details
    useEffect(() => {
        if (!service) return;
        const fetchData = async () => {
            try {
                let response;
                if (purpose === "users") {
                    response = await service.getUserDetails(primaryKey);
                } else {
                    response = await service.getGroupDetails(primaryKey);
                }
                const data = response.data;

                // Normalize backend fields to frontend state
                const normalized =
                    purpose === "users"
                        ? {
                            email: data.email,
                            username: data.username,
                            login_name: data.login_name,
                            repositoryName: data.repositoryName,
                            role: data.role,
                            active: String(data.active), // convert boolean to string for select
                        }
                        : {
                            groupName: data.group_name,
                            description: data.description,
                            groupRole: data.groupRole,
                            isLocked: String(data.isLocked ?? false),
                        };

                setFormData(normalized);
                setOriginalData(normalized);
            } catch (error) {
                console.error("Error fetching details:", error);
            }
        };
        fetchData();
    }, [service, purpose, primaryKey]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Keep string value as-is
        setFormData((prev) => ({ ...prev, [name]: value }));
        setModifiedFields((prev) => ({
            ...prev,
            [name]: originalData[name] !== value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!service) return;

        // Build payload with only changed fields
        const updatedData = {};
        Object.entries(modifiedFields).forEach(([key, changed]) => {
            if (changed) updatedData[key] = formData[key];
        });

        try {
            if (purpose === "users") {
                const payload = {
                    email: formData.email, // required identifier
                    ...updatedData,
                };

                // Uppercase role for backend enum
                if (payload.role) payload.role = payload.role.toUpperCase();

                await service.updateUser(payload);
            } else {
                const payload = {
                    groupName: formData.groupName,
                    ...updatedData,
                };

                await service.updateGroup(payload);
            }

            console.log("✅ Updated successfully!");
            onClose();
        } catch (error) {
            console.error("❌ Error updating:", error);
        }
    };

    const renderField = (label, type) => {
        const value = formData[label] ?? "";
        if (type.startsWith("input")) {
            return (
                <input
                    type="text"
                    id={label}
                    name={label}
                    className="edit-input"
                    value={value}
                    onChange={handleChange}
                    disabled={(label === "email" || label === "groupName") ? true : false}
                />
            );
        } else if (type === "textarea") {
            return (
                <textarea
                    id={label}
                    name={label}
                    className="edit-textarea"
                    value={value}
                    onChange={handleChange}
                />
            );
        } else if (type === "select") {
            const options = getSelectOptions(label);
            return (
                <select
                    id={label}
                    name={label}
                    className="edit-select"
                    value={value.toLowerCase()}
                    onChange={handleChange}
                >
                    <option value="">Select</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt.toLowerCase()}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }
        return null;
    };

    return (
        <div className="edit-form-container">
            <h3 className="edit-form-title">
                {purpose === "users" ? "Edit User" : "Edit Group"}
            </h3>

            <form className="edit-form" onSubmit={handleSave}>
                {Object.entries(labelFields).map(([label, type]) => (
                    <div key={label} className="form-field">
                        <label htmlFor={label} className="edit-label">
                            {label.replace(/([A-Z])/g, " $1").toUpperCase()}
                        </label>
                        {renderField(label, type)}
                    </div>
                ))}

                <div className="edit-form-actions">
                    <button
                        type="button"
                        className="edit-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="edit-save-btn">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditFormView;
