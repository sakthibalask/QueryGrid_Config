import React, { useEffect, useRef, useState } from "react";
import "../../assets/css/ImportConfigStyles.css";
import { configService } from "../../app-integration/API.js";
import PreviewConfigMatrix from "./PreviewConfigMatrix.jsx";

const ImportConfigUI = ({ onClose }) => {
    const formRef = useRef(null);
    const fileInputRef = useRef(null);

    const [uploadingFile, setUploadingFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [showPreview, setShowPreview] = useState(false); // Step control

    // Open file picker
    useEffect(() => {
        const form = formRef.current;
        const fileInput = fileInputRef.current;
        if (!form || !fileInput) return;

        const handleClick = () => fileInput.click();
        form.addEventListener("click", handleClick);
        return () => form.removeEventListener("click", handleClick);
    }, []);

    // Handle file selection & backend upload
    useEffect(() => {
        const fileInput = fileInputRef.current;
        if (!fileInput) return;

        const handleFileSelect = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Reset state
            setUploadedFile(null);
            setUploadingFile(file);
            setUploadProgress(0);
            setPreviewData([]);
            setShowPreview(false);

            try {
                const service = await configService();

                // Upload file
                const res = await service.importConfig(file, (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress);
                });

                setUploadingFile(null);
                setUploadedFile({
                    name: file.name,
                    size: formatSize(file.size),
                    fileObject: file,
                });
                setUploadProgress(100);

                // Save for preview
                setPreviewData(res.data.databaseConfigs || []);
            } catch (err) {
                console.error("Upload error:", err);
                setUploadingFile(null);
                setUploadProgress(0);
            }
        };

        fileInput.addEventListener("change", handleFileSelect);
        return () => fileInput.removeEventListener("change", handleFileSelect);
    }, []);

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    // Preview button handler
    const handlePreview = () => {
        if (!previewData || previewData.length === 0) return;
        setShowPreview(true);
    };

    const handleConfirmNext = () => {
        console.log("Confirmed & moving to next step");
        // TODO: implement next step workflow
    };


    // If preview is active, unmount ImportConfigUI and show PreviewConfigTable
    if (showPreview && previewData.length > 0) {
        return (
            <PreviewConfigMatrix
                configs={previewData}
                mode="import"
                onClose={() => {
                    setShowPreview(false)
                    onClose();
                }}
            />
        );
    }

    // Default: ImportConfigUI
    return (
        <div className="import-config-wrapper">
            <header className="import-config-header">Import Configuration</header>

            {/* Upload Box */}
            <form ref={formRef}>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="import-config-file-input"
                    hidden
                />
                <i className="ri-upload-cloud-2-line"></i>
                <p>Browse File to Upload</p>
            </form>

            {/* Upload Progress */}
            <section className="import-config-progress-area">
                {uploadingFile && (
                    <li className="import-config-row">
                        <i className="ri-file-code-line"></i>
                        <div className="import-config-content">
                            <div className="import-config-content-details">
                                <span className="import-config-content-name">
                                    {uploadingFile.name} • Uploading
                                </span>
                                <span className="import-config-content-percent">
                                    {Math.floor(uploadProgress)}%
                                </span>
                            </div>
                            <div className="import-config-content-progressBar">
                                <div
                                    className="import-config-content-progress"
                                    style={{
                                        width: `${uploadProgress}%`,
                                        transition: "width 0.1s linear",
                                    }}
                                ></div>
                            </div>
                        </div>
                    </li>
                )}
            </section>

            {/* Uploaded File Display */}
            <section className="import-config-uploaded-area">
                {uploadedFile && (
                    <li className="import-config-row">
                        <i className="ri-file-code-line"></i>
                        <div className="import-config-content">
                            <div className="import-config-content-details">
                                <span className="import-config-content-name">
                                    {uploadedFile.name} • Uploaded
                                </span>
                                <span className="import-config-content-size">
                                    {uploadedFile.size}
                                </span>
                            </div>
                        </div>
                        <i className="ri-file-check-line"></i>
                    </li>
                )}
            </section>

            {/* Preview Button */}
            {uploadedFile && previewData.length > 0 && (
                <div style={{ textAlign: "start", marginTop: "20px" }}>
                    <button
                        className="import-config-preview-btn"
                        onClick={handlePreview}
                    >
                        Preview Config
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportConfigUI;
