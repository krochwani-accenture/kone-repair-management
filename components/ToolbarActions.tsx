"use client";

import { useState, useRef } from "react";
import {
    Button,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Typography,
    Box,
    Stack,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { compactButtonSx } from "../lib/constants";

interface ToolbarActionsProps {
    onFilterClick?: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchChange?: (value: string) => void;
}

export function ToolbarActions({ onFileChange }: ToolbarActionsProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        if (selectedFile) {
            onFileChange({
                target: { files: [selectedFile] },
            } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
        setModalOpen(false);
        setSelectedFile(null);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <>
            <Button
                variant="text"
                startIcon={<FilterAltOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{
                    ...compactButtonSx,
                    backgroundColor: "#eef4ff",
                    color: "#0057ff",
                    "&:hover": { backgroundColor: "#e1ebff" },
                }}
            >
                Filter
            </Button>

            {/* Upload button — opens modal */}
            <Button
                variant="text"
                startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 15 }} />}
                onClick={() => setModalOpen(true)}
                sx={{
                    ...compactButtonSx,
                    backgroundColor: "#eef4ff",
                    color: "#0057ff",
                    "&:hover": { backgroundColor: "#e1ebff" },
                }}
            >
                Upload
            </Button>

            <Select
                value="Netherland"
                size="small"
                IconComponent={KeyboardArrowDownOutlinedIcon}
                sx={{
                    height: 32,
                    minWidth: 150,
                    borderRadius: "7px",
                    backgroundColor: "#fff",
                    fontSize: 12,
                    color: "#68717d",
                }}
            >
                <MenuItem value="Netherland">Netherland</MenuItem>
            </Select>

            <TextField
                size="small"
                placeholder="Search"
                sx={{
                    width: 170,
                    "& .MuiOutlinedInput-root": {
                        height: 32,
                        borderRadius: "16px",
                        backgroundColor: "#fff",
                        fontSize: 12,
                        pr: 0.5,
                    },
                }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <SearchOutlinedIcon sx={{ fontSize: 17 }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {/* Upload modal */}
            <Dialog
                open={modalOpen}
                onClose={handleCancel}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: "12px" } }}
            >
                <DialogTitle
                    sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#111827",
                        pb: 1,
                    }}
                >
                    Upload
                    <IconButton
                        onClick={handleCancel}
                        size="small"
                        sx={{
                            position: "absolute",
                            right: 12,
                            top: 12,
                            color: "#68717d",
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: "12px !important" }}>
                    <Stack spacing={2}>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleModalFileChange}
                            style={{ display: "none" }}
                            id="modal-file-input"
                        />

                        {/* Upload file button */}
                        <Button
                            component="label"
                            htmlFor="modal-file-input"
                            variant="contained"
                            fullWidth
                            startIcon={<FileUploadOutlinedIcon />}
                            sx={{
                                backgroundColor: "#0057ff",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: 14,
                                py: 1.2,
                                "&:hover": { backgroundColor: "#0046cc" },
                            }}
                        >
                            Upload file
                        </Button>

                        {/* Info note */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1,
                                backgroundColor: "#fff8f0",
                                border: "1px solid #f5c07a",
                                borderRadius: "8px",
                                px: 1.5,
                                py: 1.2,
                            }}
                        >
                            <InfoOutlinedIcon
                                sx={{ fontSize: 17, color: "#e07b00", mt: 0.1, flexShrink: 0 }}
                            />
                            <Typography sx={{ fontSize: 12, color: "#7a4500", lineHeight: 1.5 }}>
                                Note: Specific instructions for the upload or download file to be provided here
                            </Typography>
                        </Box>

                        {/* Selected file chip */}
                        {selectedFile && (
                            <Box>
                                <Chip
                                    label={selectedFile.name}
                                    onDelete={handleRemoveFile}
                                    size="small"
                                    sx={{
                                        fontSize: 12,
                                        backgroundColor: "#f0f4ff",
                                        color: "#111827",
                                        "& .MuiChip-deleteIcon": { fontSize: 15 },
                                    }}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                    <Button
                        onClick={handleCancel}
                        sx={{
                            textTransform: "none",
                            color: "#374151",
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!selectedFile}
                        sx={{
                            textTransform: "none",
                            backgroundColor: "#0057ff",
                            borderRadius: "8px",
                            fontWeight: 600,
                            px: 3,
                            "&:hover": { backgroundColor: "#0046cc" },
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
