"use client";

import { Stack, Button, Typography, CircularProgress, Alert } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { DataTable } from "../DataTable";
import { EmptyState } from "../EmptyState";
import { compactButtonSx } from "../../lib/constants";

interface ManageOfferPanelProps {
    rows: any[];
    uploadedRows: any[];
    uploadedData: any;
    dbLoading: boolean;
    onSaveToDatabase: () => void;
}

export function ManageOfferPanel({
    rows,
    uploadedRows,
    uploadedData,
    dbLoading,
    onSaveToDatabase,
}: ManageOfferPanelProps) {
    if (rows.length === 0) {
        return <EmptyState />;
    }

    return (
        <Stack spacing={1.5}>
            {uploadedRows.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={
                            dbLoading ? <CircularProgress size={14} /> : <SaveIcon />
                        }
                        onClick={onSaveToDatabase}
                        disabled={dbLoading}
                        sx={{ ...compactButtonSx, borderRadius: "7px" }}
                    >
                        Save to Database
                    </Button>
                    <Typography sx={{ fontSize: 12, color: "#68717d" }}>
                        {uploadedRows.length} uploaded rows ready
                    </Typography>
                </Stack>
            )}
            <DataTable rows={rows} />
        </Stack>
    );
}