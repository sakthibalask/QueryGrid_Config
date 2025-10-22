import React, { useEffect, useState } from "react";
import { configService } from "../../app-integration/API.js";
import "../../assets/css/PreviewForm.css";

const PreviewForm = ({ purpose, action, mode, userEmail, onSuccess }) => {
    const [formData, setFormData] = useState({});
    const [availableUsers, setAvailableUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch users for group creation
    useEffect(() => {
        if (purpose === "groups" && action === "create") {
            const fetchUsers = async () => {
                try {
                    const service = await configService();
                    const res = await service.getUsernames();
                    setAvailableUsers(res.data || []);
                } catch (error) {
                    console.error("Failed to fetch usernames:", error);
                }
            };
            fetchUsers();
        }
    }, [purpose, action]);

    // Prefill email in license mode
    useEffect(() => {
        if (mode === "allocateLicense" && userEmail) {
            setFormData({ userEmail });
        }
    }, [mode, userEmail]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        setFilteredUsers(
            availableUsers.filter(
                (u) => u.toLowerCase().includes(value.toLowerCase()) && !selectedUsers.includes(u)
            )
        );
    };

    const handleUserSelect = (user) => {
        if (!selectedUsers.includes(user)) setSelectedUsers([...selectedUsers, user]);
        setSearch("");
    };

    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter((u) => u !== user));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const service = await configService();

            if (mode === "allocateLicense") {
                await service.allocateLicense({
                    licenseName: formData.licenseName,
                    userEmail: formData.userEmail,
                    licenseType: formData.licenseType,
                    license_notes: formData.license_notes,
                });
                console.log("License allocated successfully!");
            } else if (purpose === "users") {
                await service.createUser({
                    email: formData.email,
                    username: formData.username,
                    login_name: formData.username,
                    repositoryName: formData.repositoryName,
                    password: formData.password,
                });
            } else if (purpose === "groups") {
                await service.createGroup({
                    groupName: formData.groupName,
                    description: formData.description,
                    groupRole: formData.groupRole,
                    user_emails: selectedUsers,
                });
            }

            setFormData({});
            setSelectedUsers([]);

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error submitting form", err);
            console.log("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-view-container">
            <div className="create-view-title">
                <p>
                    {mode === "allocateLicense"
                        ? "Allocate License"
                        : action === "create"
                            ? `Create ${purpose}`
                            : "Preview"}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="create-view-user_details">
                    {mode === "allocateLicense" && (
                        <>
                            <div className="create-view-input_box">
                                <label htmlFor="userEmail">User Email</label>
                                <input
                                    type="email"
                                    id="userEmail"
                                    placeholder="User Email"
                                    value={formData.userEmail || ""}
                                    onChange={handleChange}
                                    readOnly
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="licenseName">License Name</label>
                                <input
                                    type="text"
                                    id="licenseName"
                                    placeholder="Enter license name"
                                    value={formData.licenseName || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="licenseType">License Type</label>
                                <input
                                    type="text"
                                    id="licenseType"
                                    placeholder="Enter license type"
                                    value={formData.licenseType || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="license_notes">Notes</label>
                                <input
                                    type="text"
                                    id="license_notes"
                                    placeholder="Enter license notes"
                                    value={formData.license_notes || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    {/* Existing create user / group forms */}
                    {mode !== "allocateLicense" && purpose === "users" && (
                        <>
                            <div className="create-view-input_box">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter email"
                                    value={formData.email || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter username"
                                    value={formData.username || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="repositoryName">Repository</label>
                                <input
                                    type="text"
                                    id="repositoryName"
                                    placeholder="Enter repository name"
                                    value={formData.repositoryName || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Enter password"
                                    value={formData.password || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {mode !== "allocateLicense" && purpose === "groups" && (
                        <>
                            <div className="create-view-input_box">
                                <label htmlFor="groupName">Group Name</label>
                                <input
                                    type="text"
                                    id="groupName"
                                    placeholder="Enter group name"
                                    value={formData.groupName || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="description">Description</label>
                                <input
                                    type="text"
                                    id="description"
                                    placeholder="Enter description"
                                    value={formData.description || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box">
                                <label htmlFor="groupRole">Group Role</label>
                                <input
                                    type="text"
                                    id="groupRole"
                                    placeholder="Enter role (e.g., READER)"
                                    value={formData.groupRole || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="create-view-input_box" style={{ position: "relative" }}>
                                <label htmlFor="userSearch">Add Users</label>
                                <input
                                    type="text"
                                    id="userSearch"
                                    placeholder="Search and add users..."
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                                {search && filteredUsers.length > 0 && (
                                    <div className="create-view-user_search_results">
                                        {filteredUsers.map((user, idx) => (
                                            <div
                                                key={idx}
                                                className="create-view-user_item"
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                {user}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="create-view-chip_area">
                                    {selectedUsers.length > 0 ? (
                                        selectedUsers.map((user, idx) => (
                                            <span key={idx} className="create-view-chip">
                        {user}
                                                <button type="button" onClick={() => handleRemoveUser(user)}>
                          ✕
                        </button>
                      </span>
                                        ))
                                    ) : (
                                        <p className="placeholder-text">No users added yet</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="create-view-reg_btn">
                    <input type="submit" value={loading ? "Submitting..." : "Submit"} disabled={loading} />
                </div>
            </form>
        </div>
    );
};

export default PreviewForm;
