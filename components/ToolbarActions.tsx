"use client";

import { Button, Select, MenuItem, TextField, InputAdornment } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import { compactButtonSx } from "../lib/constants";

interface ToolbarActionsProps {
    onFilterClick?: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchChange?: (value: string) => void;
}

export function ToolbarActions({ onFileChange }: ToolbarActionsProps) {
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

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                style={{ display: "none" }}
                id="figma-file-input"
            />
            <Button
                component="label"
                htmlFor="figma-file-input"
                variant="text"
                startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 15 }} />}
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
        </>
    );
}