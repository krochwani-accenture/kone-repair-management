"use client";

import { Stack, Button, CircularProgress, Alert } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { DataTable } from "../DataTable";
import { compactButtonSx } from "../../lib/constants";

interface ManagePricePanelProps {
    rows: any[];
    dbLoading: boolean;
    onRefresh: () => void;
}

export function ManagePricePanel({ rows, dbLoading, onRefresh }: ManagePricePanelProps) {
    return (
        <Stack spacing={1.5}>
            <Button
                variant="text"
                onClick={onRefresh}
                disabled={dbLoading}
                startIcon={
                    dbLoading ? <CircularProgress size={14} /> : <FilterAltOutlinedIcon />
                }
                sx={{
                    ...compactButtonSx,
                    alignSelf: "flex-start",
                    backgroundColor: "#eef4ff",
                    color: "#0057ff",
                }}
            >
                Refresh
            </Button>
            {rows.length > 0 ? (
                <DataTable rows={rows} />
            ) : dbLoading ? (
                <Alert severity="info">Loading...</Alert>
            ) : (
                <Alert severity="info">No records found in database</Alert>
            )}
        </Stack>
    );
}