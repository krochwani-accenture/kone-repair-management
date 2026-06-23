"use client";

import { Alert } from "@mui/material";
import { DataTable } from "../DataTable";

interface DiffPricePanelProps {
    rows: any[];
}

export function DiffPricePanel({ rows }: DiffPricePanelProps) {
    if (rows.length > 0) {
        return <DataTable rows={rows} />;
    }
    return <Alert severity="info">No records available yet.</Alert>;
}