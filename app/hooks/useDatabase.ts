"use client";

import { useState } from "react";
import axios from "axios";
import { REPAIRS_API_URL } from "../../lib/constants";

export function useDatabase() {
    const [dbData, setDbData] = useState<any>(null);
    const [dbLoading, setDbLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchDataFromDatabase = async () => {
        setDbLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${REPAIRS_API_URL}/repairs`, {});

            if (response.data.success) {
                setDbData(response.data);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                err.message ||
                "Failed to fetch from database"
            );
        } finally {
            setDbLoading(false);
        }
    };

    const handleSaveToDatabase = async (uploadedData: any) => {
        if (!uploadedData) {
            setError("No data to save. Please upload a file first.");
            return;
        }

        setDbLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let dataToSave: any[] = [];

            if (Array.isArray(uploadedData.data)) {
                dataToSave = uploadedData.data;
            } else if (uploadedData.sheets) {
                const sheetNames =
                    uploadedData.availableSheets && uploadedData.availableSheets.length
                        ? uploadedData.availableSheets
                        : Object.keys(uploadedData.sheets);
                sheetNames.forEach((name: string) => {
                    const s = uploadedData.sheets[name];
                    if (s && Array.isArray(s.data)) dataToSave.push(...s.data);
                });
            }

            if (dataToSave.length === 0) {
                setError("No rows found to save.");
                setDbLoading(false);
                return;
            }

            const response = await axios.post(
                `${REPAIRS_API_URL}/repairs/save`,
                {
                    data: dataToSave,
                }
            );

            if (response.data.success) {
                setSuccess(
                    `Successfully saved! Inserted: ${response.data.data.inserted}, Updated: ${response.data.data.updated ?? 0}, Unchanged: ${response.data.data.unchanged ?? 0}, Skipped: ${response.data.data.skipped}`
                );
                return true;
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error || err.message || "Failed to save to database"
            );
        } finally {
            setDbLoading(false);
        }
        return false;
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    return {
        dbData,
        dbLoading,
        error,
        success,
        fetchDataFromDatabase,
        handleSaveToDatabase,
        clearMessages,
    };
}