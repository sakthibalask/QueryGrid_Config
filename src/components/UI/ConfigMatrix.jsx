import React, { useState, useEffect } from "react";
import { configService } from "../../app-integration/API.js";
import NotificationAlert from "../UI/NotificationAlert.jsx"; // adjust path if needed

const ConfigMatrix = () => {
    const [configs, setConfigs] = useState([]);
    const [groups, setGroups] = useState([]);
    const [savedMappings, setSavedMappings] = useState({});
    const [groupToConfigs, setGroupToConfigs] = useState({});
    const [isDirty, setIsDirty] = useState(false);

    const [notification, setNotification] = useState({
        type: "",
        message: "",
        timeout: 3000,
    });

    const [isFetching, setIsFetching] = useState(false);

    const fetchData = async () => {
        // if already fetching, ignore consecutive calls
        if (isFetching) return;

        setIsFetching(true);
        // show info notification while fetching
        setNotification({ type: "info", message: "Fetching configurations...", timeout: null });

        try {
            const cfgService = await configService();

            const configsRes = await cfgService.getConfigNames();
            const groupsRes = await cfgService.getGroups();

            const configsPayload = configsRes?.data || [];
            const groupsPayload = groupsRes?.data || [];

            const configList = configsPayload
                .map((c) => c.configName)
                .sort((a, b) => {
                    if (a === "default") return 1;
                    if (b === "default") return -1;
                    return a.localeCompare(b);
                });

            const groupList = (groupsPayload || []).sort((a, b) => {
                if (a === "defaultgrp") return 1;
                if (b === "defaultgrp") return -1;
                return a.localeCompare(b);
            });

            setConfigs(configList);
            setGroups(groupList);

            // Build initial mappings using the backend response that contains groupNames per config
            const initialSaved = {};
            const initialMapping = {};

            // initialize with empty sets for every known group
            groupList.forEach((g) => {
                initialSaved[g] = [];
                initialMapping[g] = new Set();
            });

            // fill mapping from configs payload
            configsPayload.forEach((cfg) => {
                const cfgName = cfg?.configName;
                (cfg?.groupNames || []).forEach((g) => {
                    if (initialMapping[g]) {
                        initialMapping[g].add(cfgName);
                    }
                });
            });

            // convert sets to arrays for savedMappings
            for (const g of groupList) {
                initialSaved[g] = Array.from(initialMapping[g]);
            }

            setSavedMappings(initialSaved);
            setGroupToConfigs(initialMapping);

            // clear notification once data is ready
            setNotification({ type: "", message: "", timeout: 0 });
        } catch (err) {
            console.error("Error loading configs/groups:", err);
            setNotification({ type: "error", message: "Failed to fetch configurations", timeout: 4000 });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        // fetch once on mount
        fetchData();
        // no polling
    }, []);

    const isMappingChanged = (current, saved) => {
        for (const group of groups) {
            const currentSet = current[group] || new Set();
            const savedList = saved[group] || [];
            if (currentSet.size !== savedList.length) return true;
            for (const item of savedList) {
                if (!currentSet.has(item)) return true;
            }
        }
        return false;
    };

    const toggleMapping = (group, config) => {
        setGroupToConfigs((prev) => {
            const updated = { ...prev };
            const currentSet = new Set(updated[group] || []);
            if (currentSet.has(config)) {
                currentSet.delete(config);
            } else {
                currentSet.add(config);
            }
            updated[group] = currentSet;
            setIsDirty(isMappingChanged(updated, savedMappings));
            return updated;
        });
    };

    const handleSave = async () => {
        try {
            setNotification({ type: "info", message: "Updating configurations...", timeout: null });

            const cfgService = await configService();

            // Build payload for each config
            const updatePromises = configs.map(async (config) => {
                // Collect groups where this config is selected
                const groupNames = groups.filter((g) => groupToConfigs[g]?.has(config));

                if (groupNames.length > 0) {
                    const payload = {
                        configName: config,
                        groupNames: groupNames,
                    };
                    return cfgService.updateConfig(payload);
                }
            });

            await Promise.all(updatePromises);

            // After success update local saved state
            const saved = {};
            for (const group of groups) {
                saved[group] = Array.from(groupToConfigs[group] || []);
            }
            setSavedMappings(saved);
            setIsDirty(false);

            setNotification({
                type: "success",
                message: "Database Configuration Updated Successfully",
                timeout: 3000,
            });
        } catch (err) {
            console.error("Error updating configs:", err);
            setNotification({
                type: "error",
                message: "Failed to update configurations",
                timeout: 4000,
            });
        }
    };


    const handleCancel = () => {
        const reverted = {};
        for (const group of groups) {
            reverted[group] = new Set(savedMappings[group] || []);
        }
        setGroupToConfigs(reverted);
        setIsDirty(false);
    };

    const handleRefreshClick = () => {
        // Prevent refresh while fetching
        if (isFetching) return;

        if (isDirty) {
            setNotification({
                type: "warning",
                message: "You have unsaved changes. Please Save or Cancel before refreshing.",
                timeout: 4000,
            });
            return;
        }

        fetchData();
    };

    return (
        <>
            {notification.message && (
                <NotificationAlert
                    type={notification.type}
                    message={notification.message}
                    timeout={notification.timeout}
                />
            )}

            <nav className="q2-config-actions-subheader">
                <li>
                    <a className="q2-config-actions-new">
                        <i className="ri-add-large-line"></i> Create
                    </a>
                </li>

                <li>
                    <a
                        className={`q2-config-actions-refresh ${isFetching ? "disabled" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleRefreshClick();
                        }}
                        aria-disabled={isFetching}
                    >
                        <i className="ri-refresh-line"></i> Refresh
                    </a>
                </li>

                <li>
                    <a
                        className={`q2-config-actions-save ${!isDirty ? "disabled" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (isDirty) handleSave();
                        }}
                    >
                        <i className="ri-save-line"></i> Save
                    </a>
                </li>
                <li>
                    <a
                        className={`q2-config-actions-cancel ${!isDirty ? "disabled" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (isDirty) handleCancel();
                        }}
                    >
                        <i className="ri-close-large-line"></i> Cancel
                    </a>
                </li>
            </nav>

            <div className="matrix-container">
                <table className="permission-table">
                    <thead>
                    <tr>
                        <th
                            className="group-column"
                            style={{ backgroundColor: "#3e57da", color: "#ffffff" }}
                        >
                            <i className="ri-database-2-line"></i> Q2-config
                        </th>
                        {configs.map((config) => (
                            <th key={config} className="vertical-header-cell">
                                <div className="vertical-header">{config}</div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {groups.map((group) => (
                        <tr key={group}>
                            <td className="group-column">{group}</td>
                            {configs.map((config) => (
                                <td
                                    key={`${group}-${config}`}
                                    className="q2-config-box"
                                    onClick={() => toggleMapping(group, config)}
                                    data-group={group}
                                    data-config={config}
                                >
                                    {groupToConfigs[group]?.has(config) && (
                                        <i className="ri-database-2-line"></i>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ConfigMatrix;
