"use client";

import { useState } from "react";
import axios from "axios";
import {
    readFileAsArrayBuffer,
    parseExcelSheets,
} from "../../lib/excelParser";
import { API_URL, AUTH_BYPASSED } from "../../lib/constants";

export function useFileUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadedData, setUploadedData] = useState<any>(null);
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setUploadedData(null);

        try {
            const fileBuffer = await readFileAsArrayBuffer(file);
            const parsed = parseExcelSheets(fileBuffer);
            setUploadedData(parsed);

            if (AUTH_BYPASSED) {
                setSuccess("File loaded successfully. Preview is ready.");
                setFile(null);
                setFileName("");
                return;
            }

            const response = await axios.get(`${API_URL}/upload/url`, {
                params: { filename: file.name },
            });

            const { uploadUrl } = response.data;
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                },
            });

            if (!uploadResponse.ok) {
                throw new Error("S3 upload failed");
            }

            setSuccess("File uploaded successfully. Preview is ready.");
            setFile(null);
            setFileName("");
        } catch (err: any) {
            setError(
                err.response?.data?.error || err.message || "Upload failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setFileName("");
        setError(null);
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    return {
        file,
        loading,
        uploadedData,
        fileName,
        error,
        success,
        handleFileChange,
        handleUpload,
        clearFile,
        clearMessages,
        setUploadedData,
    };
}