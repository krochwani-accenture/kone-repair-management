"use client";

import { Stack, Typography, Button, CircularProgress } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { compactButtonSx } from "../lib/constants";

interface FileUploadBarProps {
    fileName: string;
    loading: boolean;
    hasFile: boolean;
    onUpload: () => void;
    onClear: () => void;
}

export function FileUploadBar({ fileName, loading, hasFile, onUpload, onClear }: FileUploadBarProps) {
    if (!fileName) return null;

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
            <Typography sx={{ fontSize: 12, color: "#68717d" }}>
                Selected file: <strong>{fileName}</strong>
            </Typography>
            <Button
                variant="contained"
                onClick={onUpload}
                disabled={!hasFile || loading}
                startIcon={
                    loading ? <CircularProgress size={14} /> : <CloudUploadIcon />
                }
                sx={{
                    ...compactButtonSx,
                    borderRadius: "7px",
                    width: 118,
                    backgroundColor: "#0057ff",
                }}
            >
                Load
            </Button>
            <Button
                variant="outlined"
                onClick={onClear}
                sx={{ ...compactButtonSx, borderRadius: "7px", width: 86 }}
            >
                Clear
            </Button>
        </Stack>
    );
}