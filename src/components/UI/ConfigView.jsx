import React, {useState} from "react";
import TableCheckbox from "./TableCheckbox.jsx";
import {configService} from "../../app-integration/API.js";

const ConfigView = ({ configName, onClose }) => {
    const [configDBname, setConfigDBName] = useState("");
    const [isActive, setIsActive] = useState(false);


    const handleDeleteConfig = async () => {
        try{
            const service = await configService();
            let response = await service.deleteConfig(configName);
            console.log(response.data);
        }catch(err){
            console.error(err);
        }
        onClose();
    }

    return (
        <div className="config-view">
            {/* Header */}
            <header className="config-view-header">
                <p>Config View Details</p>
                <button className={"config-view-button opt-delete"} onClick={handleDeleteConfig}>Delete Config</button>
            </header>

            {/* Input Section */}
            <div className="config-view-input-area">
                <input
                    type="text"
                    className="config-view-input"
                    id="config-view-input-username"
                    value={configName}
                    disabled
                    style={{ pointerEvents: "none" }}
                />
            </div>

            {/* Status Toggle */}
            <div className="config-view-status-toggle">
                <span className="config-view-status-text">
                    {isActive ? "Hide" : "Show"} Tables
                </span>

                <label className="config-view-switch">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
                        className="config-view-input-toggle"
                    />
                    <span className="config-view-slider"></span>
                </label>


            </div>

            {/* Conditional Table Display */}
            {isActive === true && <TableCheckbox configName={configName} />}
        </div>
    );
};

export default ConfigView;