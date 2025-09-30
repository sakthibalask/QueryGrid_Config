import React, { useState, useMemo } from 'react';

const initialConfigs = [
    'testconfig2', 'testconfig', 'default',
    'testconfig2', 'testconfig', 'default',
    'testconfig2'
];

const initialGroups = ['testgrp', 'defaultgrp'];

const ConfigMatrix = () => {
    // Remove duplicates from configs, then sort with "default" last
    const configs = useMemo(() => {
        const unique = [...new Set(initialConfigs)];
        return unique.sort((a, b) => {
            if (a === 'default') return 1;
            if (b === 'default') return -1;
            return a.localeCompare(b);
        });
    }, []);

    // Remove duplicates from groups, then sort with "defaultgrp" last
    const groups = useMemo(() => {
        const unique = [...new Set(initialGroups)];
        return unique.sort((a, b) => {
            if (a === 'defaultgrp') return 1;
            if (b === 'defaultgrp') return -1;
            return a.localeCompare(b);
        });
    }, []);

    // Saved mapping: group -> array of configs (JSON format)
    const [savedMappings, setSavedMappings] = useState(() => {
        const initial = {};
        initialGroups.forEach(group => {
            initial[group] = [];
        });
        return initial;
    });

    // Editable state: group -> Set of configs
    const [groupToConfigs, setGroupToConfigs] = useState(() => {
        const initial = {};
        initialGroups.forEach(group => {
            initial[group] = new Set();
        });
        return initial;
    });

    const [isDirty, setIsDirty] = useState(false);

    // Compare current (Sets) with saved (Arrays)
    const isMappingChanged = (current, saved) => {
        for (const group of initialGroups) {
            const currentSet = current[group];
            const savedList = saved[group] || [];
            if (currentSet.size !== savedList.length) return true;
            for (const item of savedList) {
                if (!currentSet.has(item)) return true;
            }
        }
        return false;
    };

    const toggleMapping = (group, config) => {
        setGroupToConfigs(prev => {
            const updated = { ...prev };
            const currentSet = new Set(updated[group]);
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

    const handleSave = () => {
        const saved = {};
        for (const group of initialGroups) {
            saved[group] = Array.from(groupToConfigs[group]);
        }
        setSavedMappings(saved);
        setIsDirty(false);
        console.log('Saved Mappings (JSON):', JSON.stringify(saved, null, 2));
    };

    const handleCancel = () => {
        const reverted = {};
        for (const group of initialGroups) {
            reverted[group] = new Set(savedMappings[group] || []);
        }
        setGroupToConfigs(reverted);
        setIsDirty(false);
    };

    return (
        <>
            <nav className="q2-config-actions-subheader">
                <li>
                    <a href="#" className="q2-config-actions-new">
                        <i className="ri-add-large-line"></i> Create
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className={`q2-config-actions-save ${!isDirty ? 'disabled' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            if (isDirty) handleSave();
                        }}
                    >
                        <i className="ri-save-line"></i> Save
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className={`q2-config-actions-cancel ${!isDirty ? 'disabled' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            if (isDirty) handleCancel();
                        }}
                    >
                        <i className="ri-close-large-line"></i> Cancel
                    </a>
                </li>
                <li>
                    <a href="#" className="q2-config-actions-refresh">
                        <i className="ri-refresh-line"></i> Refresh
                    </a>
                </li>
            </nav>

            <div className="matrix-container">
                <table className="permission-table">
                    <thead>
                    <tr>
                        <th className="group-column" style={{backgroundColor: "#3e57da", color: "#ffffff"}}>
                            <i className="ri-database-2-line"></i> Q2-config
                        </th>
                        {configs.map(config => (
                            <th key={config} className="vertical-header-cell">
                                <div className="vertical-header">{config}</div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {groups.map(group => (
                        <tr key={group}>
                            <td className="group-column">{group}</td>
                            {configs.map(config => (
                                <td
                                    key={`${group}-${config}`}
                                    className="q2-config-box"
                                    onClick={() => toggleMapping(group, config)}
                                    data-group={group}
                                    data-config={config}
                                >
                                    {groupToConfigs[group].has(config) && (
                                        <i className="ri-database-2-line"></i>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>

                <style>{`
          .matrix-container {
            overflow-x: auto;
            max-width: 100%;
          }

          table.permission-table {
            width: auto;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
          }

          tr:nth-of-type(even) {
            background: #CFE8FF;
          }

          th.vertical-header-cell {
            background: #121212;
            color: white;
            font-weight: bold;
            min-width: 40px;
            padding: 0;
            cursor: pointer;
          }

          .vertical-header {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: nowrap;
            font-size: 14px;
            line-height: 1.1;
            height: 150px;
            display: inline-block;
            padding: 2px;
          }

          td {
            min-width: 30px;
            height: 30px;
            cursor: pointer;
          }

          .group-column {
            width: 120px;
            background: #f8f8f8;
            font-weight: bold;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }

          .q2-config-box i {
            font-size: 22px;
            color: #1976D2;
          }

          .q2-config-actions-subheader {
            display: flex;
            list-style: none;
            padding: 0;
              margin-top: 1rem;
            margin-bottom: 1rem;
            gap: 1rem;
          }

          .q2-config-actions-subheader li a {
            text-decoration: none;
            padding: 6px 12px;
            border-radius: 4px;
            background-color: #eee;
            color: #333;
            font-weight: 500;
          }

          .q2-config-actions-subheader li a.q2-config-actions-save {
              opacity: 1;
              background-color: #3e57da; 
              color: #ffffff;/* Blue */
          }

          .q2-config-actions-subheader li a.q2-config-actions-cancel{
              opacity: 1;
              background-color: #e50914;
              color: #ffffff;/* Blue */
          }
          
          .q2-config-actions-subheader li a.disabled {
              background-color: #aaa; /* grey */
              opacity: 1;             /* remove fade */
              pointer-events: none;
              color: #0d0f2c;
          }
                `}</style>
            </div>
        </>
    );
};

export default ConfigMatrix;
