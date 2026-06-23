"use client";

import {
    Box,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { StatusCell } from "./StatusCell";

interface DataTableProps {
    rows: any[];
}

const sourceColumns = [
    "Repair ID",
    "Category 1",
    "Category 2",
    "Category 3",
    "English (EN)",
    "Netherland (NL)",
];

const staticHeaders = [
    "Repair ID",
    "Category 1",
    "Category 2",
    "Category 3",
    "English (EN)",
    "Netherland (NL)",
    "Extended to sales org",
    "Translation done",
    "Price valid",
    "Edit",
    "Delete",
];

function getHeaderSx(index: number, label: string) {
    const widths: Record<number, number> = {
        0: 95,
        9: 64,
        10: 64,
    };
    const w = widths[index] ?? (index >= 6 && index <= 8 ? 118 : 128);
    const isAction = label === "Edit" || label === "Delete";

    return {
        width: w,
        py: 1.1,
        px: isAction ? 1 : 2,
        backgroundColor: "#f8f9fb",
        borderBottom: "1px solid #bfc5ce",
        color: "#151a22",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.2,
        textAlign: isAction ? "center" as const : "left" as const,
    };
}

export function DataTable({ rows }: DataTableProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 0,
                borderTop: "1px solid #c9ced6",
                backgroundColor: "transparent",
                overflow: "hidden",
            }}
        >
            <TableContainer sx={{ maxHeight: "calc(100vh - 220px)" }}>
                <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow>
                            {staticHeaders.map((column, index) => (
                                <TableCell key={column} sx={getHeaderSx(index, column)}>
                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        sx={{ alignItems: "center", justifyContent: column === "Edit" || column === "Delete" ? "center" : "flex-start" }}
                                    >
                                        <span>{column}</span>
                                        {index > 0 && index < 4 && (
                                            <SwapVertOutlinedIcon sx={{ fontSize: 15 }} />
                                        )}
                                        {index >= 6 && index <= 8 && (
                                            <FilterAltOutlinedIcon sx={{ fontSize: 14 }} />
                                        )}
                                    </Stack>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((row: any, index: number) => (
                            <TableRow
                                key={index}
                                sx={{
                                    height: 45,
                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f6f7f9",
                                    "&:hover": { backgroundColor: "#eef4ff" },
                                }}
                            >
                                {sourceColumns.map((header, columnIndex) => {
                                    const value = row[header] ?? "-";
                                    return (
                                        <TableCell
                                            key={`${index}-${header}`}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                borderBottom: "1px solid #dfe3e8",
                                                color: "#252b35",
                                                fontSize: 12,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {String(value)}
                                        </TableCell>
                                    );
                                })}

                                {[0, 1, 2].map((i) => (
                                    <TableCell
                                        key={`status-${index}-${i}`}
                                        sx={{ borderBottom: "1px solid #dfe3e8" }}
                                    >
                                        <StatusCell index={index} />
                                    </TableCell>
                                ))}

                                <TableCell
                                    align="center"
                                    sx={{ borderBottom: "1px solid #dfe3e8", px: 1 }}
                                >
                                    <Tooltip title="Edit">
                                        <IconButton size="small" sx={{ color: "#111827" }}>
                                            <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ borderBottom: "1px solid #dfe3e8", px: 1 }}
                                >
                                    <Tooltip title="Delete">
                                        <IconButton size="small" sx={{ color: "#111827" }}>
                                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack
                direction="row"
                sx={{
                    minHeight: 56,
                    px: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #e2e6ea",
                }}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, color: "#68717d" }}>
                        Rows per page
                    </Typography>
                    <Select
                        value={30}
                        size="small"
                        IconComponent={KeyboardArrowDownOutlinedIcon}
                        sx={{
                            height: 32,
                            minWidth: 58,
                            borderRadius: "6px",
                            fontSize: 12,
                            backgroundColor: "#fff",
                        }}
                    >
                        <MenuItem value={30}>30</MenuItem>
                    </Select>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, color: "#0057ff" }}>1</Typography>
                    <Typography sx={{ fontSize: 12 }}>2</Typography>
                    <Typography sx={{ fontSize: 12 }}>3</Typography>
                    <Typography sx={{ fontSize: 12 }}>4</Typography>
                    <Typography sx={{ fontSize: 12 }}>5</Typography>
                    <Typography sx={{ fontSize: 12, color: "#68717d" }}>...</Typography>
                    <Typography sx={{ fontSize: 12 }}>10</Typography>
                </Stack>
            </Stack>
        </Paper>
    );
}