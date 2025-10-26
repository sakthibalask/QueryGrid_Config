import React, { useEffect, useState } from "react";
import { configService } from "../../app-integration/API.js";

const TableCheckbox = ({ configName }) => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkedTables, setCheckedTables] = useState(new Set()); // current checked
    const [initialChecked, setInitialChecked] = useState(new Set()); // baseline snapshot
    const [isModified, setIsModified] = useState(false); // detect change
    const [isUpdating, setIsUpdating] = useState(false); // loading state for update

    useEffect(() => {
        if (!configName) return;

        let isMounted = true;
        const fetchTablesAndAccess = async () => {
            const service = await configService();
            try {
                setLoading(true);
                setError(null);

                // fetch all tables
                const tablesResponse = await service.getDbTables(configName);
                // fetch access records
                const accessResponse = await service.fetchAccessRecords(configName);

                if (isMounted) {
                    if (tablesResponse?.data) {
                        setTables(tablesResponse.data);

                        if (accessResponse?.data && Array.isArray(accessResponse.data)) {
                            const granted = new Set(accessResponse.data.map((t) => t.toLowerCase()));
                            const matched = tablesResponse.data
                                .filter((tbl) => granted.has(tbl.table_name.toLowerCase()))
                                .map((tbl) => tbl.table_name);

                            const initial = new Set(matched);
                            setCheckedTables(initial);
                            setInitialChecked(initial);
                        }
                    } else {
                        setError("No table data found");
                    }
                }
            } catch (err) {
                console.error("Error fetching tables/access:", err);
                if (isMounted) setError("Failed to fetch tables or access data");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTablesAndAccess();

        return () => {
            isMounted = false;
        };
    }, [configName]);

    const handleCheckboxChange = (tableName) => {
        setCheckedTables((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(tableName)) {
                newSet.delete(tableName);
            } else {
                newSet.add(tableName);
            }

            // detect difference from initial
            const modified =
                newSet.size !== initialChecked.size ||
                [...newSet].some((t) => !initialChecked.has(t));
            setIsModified(modified);

            return newSet;
        });
    };

    const handleUpdateAccess = async () => {
        if (!isModified || isUpdating) return;
        try {
            setIsUpdating(true);
            const service = await configService();

            const payload = {
                configName,
                grantedRecords: Array.from(checkedTables),
            };

            await service.updateConfig(payload);

            // After successful update, reset baseline
            setInitialChecked(new Set(checkedTables));
            setIsModified(false);
            console.log("Access updated successfully!");
        } catch (err) {
            console.error("Error updating access:", err);
            console.log("Failed to update access. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <fieldset className="table-fieldset">
                <legend className="table-legend">Tables</legend>

                {loading ? (
                    <p style={{ color: "var(--text-dark)", padding: "1rem" }}>
                        Loading tables...
                    </p>
                ) : error ? (
                    <p style={{ color: "red", padding: "1rem" }}>{error}</p>
                ) : tables.length === 0 ? (
                    <p style={{ color: "var(--text-dark)", padding: "1rem" }}>
                        No tables available.
                    </p>
                ) : (
                    tables.map((item) => (
                        <div className="table-div" key={item.table_name}>
                            <input
                                type="checkbox"
                                id={`table-${item.table_name.toLowerCase()}`}
                                name={`table-${item.table_name.toLowerCase()}`}
                                className="table-input"
                                checked={checkedTables.has(item.table_name)}
                                onChange={() => handleCheckboxChange(item.table_name)}
                            />
                            <label
                                htmlFor={`table-${item.table_name.toLowerCase()}`}
                                className="table-label"
                            >
                                {item.table_name}
                            </label>
                        </div>
                    ))
                )}
            </fieldset>

            <div className="table-buttons-group">
                <button
                    className={`config-view-button opt-grant ${
                        !isModified ? "disabled" : ""
                    }`}
                    disabled={!isModified || isUpdating}
                    onClick={handleUpdateAccess}
                >
                    {isUpdating ? "Updating..." : "Update Access"}
                </button>
            </div>
        </>
    );
};

export default TableCheckbox;
