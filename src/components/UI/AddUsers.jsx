import React, { useState, useEffect } from "react";
import "../../assets/css/AddUsers.css";
import { Search } from "lucide-react";
import { configService } from "../../app-integration/API.js";

const AddUsers = ({ existingUsers = [], groupName, onClose }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                const service = await configService();
                const response = await service.getUsernames();
                const usernames = response?.data || [];

                setAllUsers(usernames);
                setSelectedUsers(existingUsers); // prefill existing users
            } catch (err) {
                console.error("Failed to fetch usernames:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllUsers();
    }, [existingUsers]);

    const filteredUsers = allUsers.filter(
        (user) =>
            user.toLowerCase().includes(search.toLowerCase()) &&
            !selectedUsers.includes(user)
    );

    const handleAddUser = (user) => {
        if (!selectedUsers.includes(user)) {
            setSelectedUsers((prev) => [...prev, user]);
        }
        setSearch("");
    };

    const handleRemoveUser = (user) => {
        setSelectedUsers((prev) => prev.filter((u) => u !== user));
    };

    const updateGroupUsers = async (groupName) => {
        let payload = {
            "groupName": groupName,
            "user_emails": selectedUsers.map(u => typeof u === "string" ? u : u.email)
        }
        const service = await configService();
        let response = await service.updateGroup(payload);
        // console.log(response.data);
        onClose();
    }

    return (
        <div className="add-user-container">
            <div className="add-user-header">
                <h3 className="add-user-title">
                    Manage Users in <span className="add-user-group">{groupName}</span>
                </h3>
            </div>

            <div className="add-user-search-container">
                <div className="add-user-input-wrapper">
                    <Search size={18} className="add-user-search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="add-user-search-input"
                    />
                </div>

                {search && filteredUsers.length > 0 && (
                    <ul className="add-user-dropdown">
                        {filteredUsers.map((user, index) => (
                            <li
                                key={index}
                                onClick={() => handleAddUser(user)}
                                className="add-user-dropdown-item"
                            >
                                {user}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="add-user-chip-container">
                {loading ? (
                    <p className="add-user-placeholder">Loading users...</p>
                ) : selectedUsers.length === 0 ? (
                    <p className="add-user-placeholder">No users added yet.</p>
                ) : (
                    selectedUsers.map((user, index) => (
                        <div key={index} className="add-user-chip">
                            <span className="add-user-chip-text">{user}</span>
                            <span
                                className="add-user-chip-close"
                                onClick={() => handleRemoveUser(user)}
                            >
                                &times;
                            </span>
                        </div>
                    ))
                )}
            </div>

            <div className={"add-user-button-grp"}>
                <button  className="view-button update-btn" onClick={(e) => {
                    e.stopPropagation();
                    updateGroupUsers(groupName);
                }}>Add Users</button>
            </div>
        </div>
    );
};

export default AddUsers;
