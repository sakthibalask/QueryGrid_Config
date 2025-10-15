import React, { useEffect, useState } from "react";
import { configService } from "../../app-integration/API.js";
import "../../assets/css/View.css";

const View = ({ purpose }) => {
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const headers =
        purpose === "users"
            ? ["Email", "Username", "Login Name", "Repository", "Role", "Active", "Licensed"]
            : ["Group Name", "Description", "Group Role", "User Emails"];

    // Fetch data
    useEffect(() => {
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
                setCurrentPage(1); // reset page on purpose change
            } catch (err) {
                console.error(`Failed to fetch ${purpose}`, err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [purpose]);

    // Search filter
    useEffect(() => {
        if (!search) {
            setFiltered(data);
        } else {
            const lower = search.toLowerCase();
            setFiltered(
                data.filter((item) => JSON.stringify(item).toLowerCase().includes(lower))
            );
        }
        setCurrentPage(1); // reset page on search
    }, [search, data]);

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

    const toggleSelect = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selected.length === paginatedData.length) {
            setSelected([]);
        } else {
            setSelected(paginatedData.map((_, idx) => idx));
        }
    };

    const handleDelete = () => {
        if (selected.length === 0) return alert("Select at least one item to delete.");
        alert(`Delete ${purpose}: ${selected.length} selected.`);
    };

    const handleUpdate = () => {
        if (selected.length !== 1) return alert("Select only one item to update.");
        alert(`Update ${purpose}: index ${selected[0]}`);
    };

    return (
        <main className="view-main">
            <div className="view-content">
                {/* Header Section */}
                <section className="view-main-header view-grid">
                    <h1>{purpose === "users" ? "Users" : "Groups"}</h1>
                    <div className="view-header-actions">
                        <button className="view-button create-btn">
                            {purpose === "users" ? <i className="ri-user-add-line"></i> :
                                <i className="ri-team-line"></i>}
                            <span>Add new {purpose === "users" ? "User" : "Group"}</span>
                        </button>
                        <button className="view-button delete-btn" onClick={handleDelete}>
                            <i className="ri-delete-bin-6-line"></i>
                            <span>Delete {purpose === "users" ? "User" : "Group"}</span>
                        </button>
                    </div>
                </section>

                {/* Summary */}
                <section className="view-summary">
                    <p>Selected {selected.length} of {data.length} {purpose}</p>
                    <button className="view-button update-btn" onClick={handleUpdate}>
                        <i className="ri-edit-2-line"></i>
                        <span>Update {purpose === "users" ? "User" : "Group"}</span>
                    </button>
                </section>

                {/* Search */}
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
                                            checked={selected.length === paginatedData.length && paginatedData.length > 0}
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
                            {paginatedData.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className={selected.includes(idx) ? "selected" : ""}
                                    onClick={() => toggleSelect(idx)}
                                >
                                    <td>
                                        <div className="view-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(idx)}
                                                readOnly
                                            />
                                            <span className="checkmark"></span>
                                        </div>
                                    </td>
                                    {purpose === "users" ? (
                                        <>
                                            <td>{item.email}</td>
                                            <td>{item.username}</td>
                                            <td>{item.login_name}</td>
                                            <td>{item.repositoryName}</td>
                                            <td>{item.role}</td>
                                            <td>{item.active ? "Yes" : "No"}</td>
                                            <td>{item.licensed ? "Yes" : "No"}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{item.group_name}</td>
                                            <td>{item.description}</td>
                                            <td>{item.groupRole}</td>
                                            <td>{item.user_emails.join(", ")}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
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

                <div className="view-displaying">
                    <p>Displaying 1~{itemsPerPage} of {data.length} {purpose}</p>
                    <section className="view-pagination view-grid">
                        <button className="view-button icon-btn" onClick={goPrev} disabled={currentPage === 1}>
                            <i className="ri-arrow-left-line"></i>
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button className="view-button icon-btn" onClick={goNext} disabled={currentPage === totalPages}>
                            <i className="ri-arrow-right-line"></i>
                        </button>
                    </section>
                </div>

                {/* Pagination */}

            </div>
        </main>
    );
};

export default View;
