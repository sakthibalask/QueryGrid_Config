import React, { useState, useEffect } from "react";
import { configService } from "../../app-integration/API.js";

const PreviewConfigMatrix = ({ configs, mode = "import", onClose }) => {
    const [permissions, setPermissions] = useState({});

    if (!configs || configs.length === 0) {
        return (
            <p style={{ textAlign: "center", color: "#fff" }}>
                No configurations to display.
            </p>
        );
    }

    const uniqueGroups = Array.from(
        new Set(configs.flatMap(cfg => cfg.groupNames || []))
    );

    useEffect(() => {
        if (!configs || configs.length === 0) return;
        const initial = {};
        configs.forEach(cfg => {
            if (!initial[cfg.configName]) initial[cfg.configName] = {};
            uniqueGroups.forEach(group => {
                initial[cfg.configName][group] =
                    cfg.groupNames?.includes(group) || false;
            });
        });
        setPermissions(initial);
    }, [configs]);

    const handleButtonClick = async (e) => {
        e.preventDefault();
        try {
            const service = await configService();

            if (mode === "import") {
                const res = await service.saveConfig({ databaseConfigs: configs });
                alert(res.data);
            } else if (mode === "export") {
                const xmlContent = generateXML(configs);

                const now = new Date();
                const fileName = `config-${now.getFullYear()}-${(now.getMonth()+1)
                    .toString().padStart(2,'0')}-${now.getDate()
                    .toString().padStart(2,'0')}-${now.getHours()
                    .toString().padStart(2,'0')}-${now.getMinutes()
                    .toString().padStart(2,'0')}.xml`;

                const blob = new Blob([xmlContent], { type: "application/xml" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error(`❌ Error during ${mode} operation:`, error);
        }
    };

    const generateXML = (configs) => {
        const escapeXml = (unsafe) => {
            if (!unsafe) return "";
            return unsafe.replace(/[<>&'"]/g, (c) => ({
                "<": "&lt;",
                ">": "&gt;",
                "&": "&amp;",
                "'": "&apos;",
                '"': "&quot;"
            }[c]));
        };

        let xml = `<DatabaseConfigs>\n  <databaseConfigs>\n`;
        configs.forEach(cfg => {
            xml += `    <databaseConfigs>\n`;
            xml += `      <configName>${escapeXml(cfg.configName)}</configName>\n`;
            xml += `      <dbType>${escapeXml(cfg.dbType)}</dbType>\n`;
            xml += `      <host>${escapeXml(cfg.host)}</host>\n`;
            xml += `      <port>${cfg.port}</port>\n`;
            xml += `      <databaseName>${escapeXml(cfg.databaseName)}</databaseName>\n`;
            xml += `      <username>${escapeXml(cfg.username)}</username>\n`;
            xml += `      <password>${escapeXml(cfg.password)}</password>\n`;
            xml += `      <configType>${escapeXml(cfg.configType)}</configType>\n`;
            xml += `      <groupNames>\n`;
            cfg.groupNames.forEach(group => {
                xml += `        <groupNames>${escapeXml(group)}</groupNames>\n`;
            });
            xml += `      </groupNames>\n`;
            xml += `      <connectionUrl>${escapeXml(cfg.connectionUrl)}</connectionUrl>\n`;
            xml += `    </databaseConfigs>\n`;
        });
        xml += `  </databaseConfigs>\n</DatabaseConfigs>\n`;
        return xml;
    };

    if (Object.keys(permissions).length === 0) {
        return <p style={{ textAlign: "center" }}>Loading matrix...</p>;
    }

    return (
        <div className="preview-matrix-container">
            <h1>Configuration Preview</h1>
            <div className="matrix-container preview-mt-container">
                <table className="permission-table">
                    <thead>
                    <tr>
                        <th className="group-column" style={{ backgroundColor: "#3e57da", color: "#fff" }}>
                            <i className="ri-database-2-line"></i> Q2-Config
                        </th>
                        {configs.map((cfg, idx) => (
                            <th key={idx} className="vertical-header-cell">
                                <div className="vertical-header">{cfg.configName}</div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {uniqueGroups.map((group, rowIdx) => (
                        <tr key={rowIdx}>
                            <td className="group-column">{group}</td>
                            {configs.map((cfg, colIdx) => (
                                <td key={colIdx} className="q2-config-box" style={{ pointerEvents: "none" }}>
                                    <input
                                        type="checkbox"
                                        checked={permissions[cfg.configName]?.[group] || false}
                                        disabled={true}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="preview-matrix-button">
                <button className="preview-button" onClick={handleButtonClick}>
                    {mode === "import" ? "Save Config" : "Export Config"}
                </button>
                <button
                    className="preview-button preview-close-btn"
                    onClick={onClose}
                    style={{ marginLeft: "10px", backgroundColor: "#ff4d4f" }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default PreviewConfigMatrix;
