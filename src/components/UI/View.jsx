import React, { useEffect, useState } from "react";
import { configService } from "../../app-integration/API.js";
import "../../assets/css/View.css";
import PreviewForm from "./PreviewForm.jsx";
import LicenseKeyInfo from "./LicenseKeyInfo.jsx";
import NotificationAlert from "./NotificationAlert.jsx";
import AddUsers from "./AddUsers.jsx";
import EditFormView from "./EditFormView.jsx";

const View = ({ purpose }) => {
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupContent, setPopupContent] = useState(null);
    const [notificationmsg, setNotificationmsg] = useState(null);
    const [existingUsers, setExistingUsers] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [adduserpopup, setAdduserpopup] = useState(false);
    const [updatePopup, setUpdatePopup] = useState(false);
    const itemsPerPage = 4;

    const headers =
        purpose === "users"
            ? ["Email", "Username", "Repository", "Role", "Active", "Licensed", "License Key"]
            : ["Group Name", "Description", "Group Role", "User Emails", "Add User"];

    // ✅ Fetch reusable function
    const fetchData = async () => {
        setLoading(true);
        try {
            const service = await configService();
            let res;
            if (purpose === "users") {
                res = await service.getUsersDetails();
                setData(res?.data?.users || []);
                setFiltered(res?.data?.users || []);
            } else {
                res = await service.getGroupsDetails();
                setData(res?.data?.allGroups || []);
                setFiltered(res?.data?.allGroups || []);
            }
            setCurrentPage(1);
        } catch (err) {
            console.error(`Failed to fetch ${purpose}`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [purpose]);

    useEffect(() => {
        if (!search) {
            setFiltered(data);
        } else {
            const lower = search.toLowerCase();
            setFiltered(data.filter((item) => JSON.stringify(item).toLowerCase().includes(lower)));
        }
        setCurrentPage(1);
    }, [search, data]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

    // ✅ FIXED: Unique key per purpose (email for users, group_name for groups)
    const getRowKey = (item) => (purpose === "users" ? item.email : item.group_name);

    // ✅ FIXED: Select toggle uses correct identifier
    const toggleSelect = (key) =>
        setSelected((prev) =>
            prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
        );

    // ✅ FIXED: Select all works correctly per purpose
    const handleSelectAll = () => {
        if (selected.length === paginatedData.length) {
            setSelected([]);
        } else {
            setSelected(paginatedData.map((item) => getRowKey(item)));
        }
    };

    // ✅ Modified: Log selected user emails when deleting
    const handleDelete = async () => {
        const service = await configService();
        if (purpose === "users" && selected.length >= 1) {
            for (let i = 0; i < selected.length; i++) {
                await service.deleteUser(selected[i]);
            }
            setNotificationmsg(
                selected.length > 1
                    ? "Selected users are deleted successfully."
                    : `User ${selected[0]} deleted successfully.`
            );
            setSelected([]);
            setTimeout(() => {
                fetchData();
            }, 2010);
        } else if (purpose === "groups" && selected.length >= 1) {
            // need to implement
            for(let i = 0; i < selected.length; i++) {
                await service.deleteGroup(selected[i]);
            }
            setNotificationmsg(
                selected.length > 1
                ? "Selected groups are deleted successfully."
                    : `Group ${selected[0]} deleted successfully.`
            )
            setSelected([]);
            setTimeout(() => {
                fetchData();
            }, 2010);
        } else {
            window.alert("Select any item to delete");
        }
    };

    // ✅ Handle Update (demo)
    const handleUpdate = () => {
        if (selected.length !== 1) {
            console.log("Please select only one item to update.");
            return;
        }
        setUpdatePopup(true);
    };

    // ✅ Handle License Key Popup dynamically
    const handleLicenseKeyClick = async (item) => {
        if (item.licensed) {
            try {
                const service = await configService();
                const licenseKey = await service.getUserLicense(item.email);

                // Show LicenseKeyInfo component with fetched license
                setPopupContent(
                    <LicenseKeyInfo
                        licenseKey={licenseKey} // now dynamic
                        userEmail={item.email}
                    />
                );
            } catch (err) {
                console.error("Failed to fetch license key:", err);
                alert("Failed to fetch license key. Please try again.");
            }
        } else {
            // Show PreviewForm to allocate license
            setPopupContent(
                <PreviewForm
                    purpose="users"
                    mode="allocateLicense"
                    userEmail={item.email}
                    onSuccess={() => {
                        setPopupContent(null);
                        fetchData();
                    }}
                />
            );
        }
    };

    const handleAddUserClick = (userlist, groupName) => {
        setSelectedGroup(groupName);
        setExistingUsers(userlist);
        setAdduserpopup(true);
    }

    return (
        <>
            <main className="view-main">
                <div className="view-content">
                    {/* Header */}
                    <section className="view-main-header view-grid">
                        <h1>{purpose === "users" ? "Users" : "Groups"}</h1>
                        <div className="view-header-actions">
                            {/* ✅ Add new button always visible */}
                            <button
                                className="view-button create-btn"
                                onClick={() => {
                                    setPopupContent(
                                        <PreviewForm
                                            purpose={purpose}
                                            action="create"
                                            onSuccess={() => {
                                                setPopupContent(null);
                                                fetchData();
                                            }}
                                        />
                                    );
                                }}
                            >
                                {purpose === "users" ? (
                                    <i className="ri-user-add-line"></i>
                                ) : (
                                    <i className="ri-team-line"></i>
                                )}
                                <span>Add new {purpose === "users" ? "User" : "Group"}</span>
                            </button>

                            <button
                                className="view-button create-btn"
                                onClick={() => fetchData()}
                            >
                                <i className="ri-refresh-line"></i>
                                <span>Refresh {purpose === "users" ? "User" : "Group"}</span>
                            </button>

                            {/* ✅ Show Update & Delete only when items selected */}
                            {selected.length > 0 && (
                                <>
                                    {selected.length === 1 && (
                                        <button
                                            className="view-button update-btn"
                                            onClick={handleUpdate}
                                        >
                                            <i className="ri-edit-line"></i>
                                            <span>Update</span>
                                        </button>
                                    )}
                                    <button
                                        className="view-button delete-btn"
                                        onClick={(e) => handleDelete(e)}
                                    >
                                        <i className="ri-delete-bin-6-line"></i>
                                        <span>Delete</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Table Search */}
                    <section className="view-table-header view-grid">
                        <div className="view-search-container">
                            <i className="ri-search-line"></i>
                            <input
                                type="text"
                                placeholder={`Search ${purpose}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </section>

                    {/* Table */}
                    <div className="view-card">
                        {loading ? (
                            <div className="view-loader">Loading...</div>
                        ) : (
                            <table>
                                <thead>
                                <tr>
                                    <th>
                                        <div className="view-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selected.length === paginatedData.length &&
                                                    paginatedData.length > 0
                                                }
                                                onChange={handleSelectAll}
                                            />
                                            <span className="checkmark"></span>
                                        </div>
                                    </th>
                                    {headers.map((h) => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedData.map((item) => {
                                    const key = getRowKey(item);
                                    return (
                                        <tr
                                            key={key}
                                            className={selected.includes(key) ? "selected" : ""}
                                            onClick={() => toggleSelect(key)}
                                        >
                                            <td>
                                                <div className="view-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(key)}
                                                        readOnly
                                                    />
                                                    <span className="checkmark"></span>
                                                </div>
                                            </td>

                                            {purpose === "users" ? (
                                                <>
                                                    <td>{item.email}</td>
                                                    <td>{item.username}</td>
                                                    <td>{item.repositoryName}</td>
                                                    <td>{item.role}</td>
                                                    <td>{item.active ? "Yes" : "No"}</td>
                                                    <td>{item.licensed ? "Yes" : "No"}</td>
                                                    <td>
                                                        <button
                                                            className="view-button update-btn small-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLicenseKeyClick(item);
                                                            }}
                                                        >
                                                            <i className="ri-key-fill"></i>
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{item.group_name}</td>
                                                    <td>{item.description}</td>
                                                    <td>{item.groupRole}</td>
                                                    {item?.user_emails?.length > 0 ? (
                                                        <td>{item.user_emails?.join(", ")}</td>
                                                    ):(
                                                        <td>No users added</td>
                                                    )}

                                                    <td>
                                                        <button
                                                            className="view-button small-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddUserClick(item?.user_emails, item.group_name);
                                                            }}
                                                        >
                                                            <i className="ri-user-add-line"></i>
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                                {!paginatedData.length && (
                                    <tr>
                                        <td colSpan={headers.length + 1} style={{ textAlign: "center" }}>
                                            No {purpose} found
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="view-displaying">
                        <p>
                            Displaying {(currentPage - 1) * itemsPerPage + 1}~
                            {Math.min(currentPage * itemsPerPage, data.length)} of{" "}
                            {data.length} {purpose}
                        </p>
                        <section className="view-pagination view-grid">
                            <button
                                className="view-button icon-btn"
                                onClick={goPrev}
                                disabled={currentPage === 1}
                            >
                                <i className="ri-arrow-left-line"></i>
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="view-button icon-btn"
                                onClick={goNext}
                                disabled={currentPage === totalPages}
                            >
                                <i className="ri-arrow-right-line"></i>
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* Popup Content */}
            {popupContent && (
                <>
                    <div className="popup-overlay" onClick={() => setPopupContent(null)}></div>
                    <section className="preview-form-popup-area">{popupContent}</section>
                </>
            )}


            {(adduserpopup && purpose === "groups") && (
                <>
                    <div className="popup-overlay" onClick={() => setAdduserpopup(false)}></div>
                    <section className="preview-form-popup-area">
                        <AddUsers existingUsers={existingUsers} groupName={selectedGroup} onClose={() => {
                            setAdduserpopup(false);
                            fetchData();
                        }}/>
                    </section>
                </>
            )}

            {updatePopup && (
                <>
                    <div className="popup-overlay" onClick={() => setUpdatePopup(false)}></div>
                    <section className="preview-form-popup-area">
                        <EditFormView purpose={purpose} primaryKey={selected[0]} onClose={() => {
                            fetchData();
                            setUpdatePopup(false);
                        }} />
                    </section>


                </>
            )}

            {notificationmsg !== null && (
                <NotificationAlert type={"success"} message={notificationmsg} timeout={2000} />
            )}
        </>
    );
};

export default View;
