"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export function EmptyState() {
    return (
        <Paper
            elevation={0}
            sx={{
                display: "grid",
                placeItems: "center",
                minHeight: 430,
                borderRadius: 0,
                border: "1px dashed #b9c2d0",
                backgroundColor: "#fff",
            }}
        >
            <Stack spacing={2} sx={{ alignItems: "center" }}>
                <CloudUploadIcon sx={{ fontSize: 48, color: "#0057ff" }} />
                <Typography sx={{ fontSize: 14, color: "#111827" }}>
                    Select an Excel file with the Upload action.
                </Typography>
            </Stack>
        </Paper>
    );
}