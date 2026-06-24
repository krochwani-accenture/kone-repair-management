"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
    Box,
    Checkbox,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Popper,
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
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { StatusCell } from "./StatusCell";
import { statusPalette } from "../lib/constants";

interface DataTableProps {
    rows: any[];
    searchQuery?: string;
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

const sortableColumnIndices = new Set([1, 2, 3]);
const filterColumnIndices = new Set([6, 7, 8]);
const statusOptions = statusPalette.map((s) => s.label);

type SortDirection = "asc" | "desc" | null;

function getHeaderSx(index: number, label: string) {
    const widths: Record<number, number> = { 0: 95, 9: 64, 10: 64 };
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

function getSortIcon(direction: SortDirection) {
    if (direction === "asc") return <ArrowUpwardOutlinedIcon sx={{ fontSize: 15, color: "#0057ff" }} />;
    if (direction === "desc") return <ArrowDownwardOutlinedIcon sx={{ fontSize: 15, color: "#0057ff" }} />;
    return <SwapVertOutlinedIcon sx={{ fontSize: 15, color: "#68717d" }} />;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    const range = 2;
    const start = Math.max(1, current - range);
    const end = Math.min(total, current + range);

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
        if (end < total - 1) pages.push("...");
        pages.push(total);
    }
    return pages;
}

export function DataTable({ rows, searchQuery }: DataTableProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [filteredStatuses, setFilteredStatuses] = useState<string[]>([]);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    // Reset to page 0 when rows change (e.g. global search filtering)
    useEffect(() => {
        setPage(0);
    }, [rows.length]);

    const isFilterOpen = anchorEl !== null;
    const hasActiveFilter = filteredStatuses.length > 0;

    const handleFilterClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isFilterOpen) {
                setAnchorEl(null);
            } else {
                setAnchorEl(e.currentTarget);
            }
        },
        [isFilterOpen]
    );

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleToggle = useCallback((status: string) => {
        setFilteredStatuses((prev) => {
            if (prev.indexOf(status) >= 0) {
                return prev.filter((s) => s !== status);
            }
            return [...prev, status];
        });
    }, []);

    const handleClearFilter = useCallback(() => {
        setAnchorEl(null);
        setFilteredStatuses([]);
    }, []);

    const handleSort = useCallback(
        (columnName: string) => {
            if (sortColumn === columnName) {
                if (sortDirection === "asc") {
                    setSortDirection("desc");
                } else if (sortDirection === "desc") {
                    setSortColumn(null);
                    setSortDirection(null);
                }
            } else {
                setSortColumn(columnName);
                setSortDirection("asc");
            }
        },
        [sortColumn, sortDirection]
    );

    const filteredRows = useMemo(() => {
        let result = rows.map((row: any, i: number) => {
            // Augment with computed status label so search can match "completed", "pending", etc.
            const statusLabel = statusPalette[i % statusPalette.length].label;
            return { row, originalIndex: i, _statusLabel: statusLabel };
        });

        // Apply global search filter
        if (searchQuery && searchQuery.trim()) {
            const lowerQuery = searchQuery.trim().toLowerCase();
            result = result.filter(({ row, _statusLabel }) => {
                try {
                    // Include status label in the searchable text
                    const searchText = JSON.stringify(row) + " " + _statusLabel;
                    return searchText.toLowerCase().includes(lowerQuery);
                } catch {
                    return false;
                }
            });
        }

        // Apply status filter
        if (filteredStatuses.length > 0) {
            result = result.filter(({ originalIndex }) => {
                const status = statusPalette[originalIndex % statusPalette.length];
                return filteredStatuses.indexOf(status.label) >= 0;
            });
        }

        // Apply sort
        if (sortColumn && sortDirection) {
            result = [...result].sort((a, b) => {
                const valA = String(a.row[sortColumn] ?? "").toLowerCase();
                const valB = String(b.row[sortColumn] ?? "").toLowerCase();
                if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                if (valA > valB) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [rows, searchQuery, filteredStatuses, sortColumn, sortDirection]);

    const visibleRows = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, page, rowsPerPage]);

    const totalCount = filteredRows.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const pageNumbers = getPageNumbers(page + 1, totalPages);

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
                            {staticHeaders.map((column, index) => {
                                const colName = sourceColumns[index] || column;
                                const sortDir = sortColumn === colName ? sortDirection : null;
                                return (
                                    <TableCell key={column} sx={getHeaderSx(index, column)}>
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            sx={{
                                                alignItems: "center",
                                                justifyContent:
                                                    column === "Edit" || column === "Delete"
                                                        ? "center"
                                                        : "flex-start",
                                            }}
                                        >
                                            <span>{column}</span>
                                            {sortableColumnIndices.has(index) && (
                                                <Tooltip
                                                    title={
                                                        sortDir === "asc"
                                                            ? "Sorted ascending — click to sort descending"
                                                            : sortDir === "desc"
                                                            ? "Sorted descending — click to clear sort"
                                                            : "Click to sort ascending"
                                                    }
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleSort(colName)}
                                                        sx={{
                                                            p: 0.25,
                                                            borderRadius: "4px",
                                                            backgroundColor: sortDir
                                                                ? "#dce8ff"
                                                                : "transparent",
                                                        }}
                                                    >
                                                        {getSortIcon(sortDir)}
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {filterColumnIndices.has(index) && (
                                                <Tooltip
                                                    title={isFilterOpen ? "Clear filter" : "Filter by status"}
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleFilterClick}
                                                        sx={{
                                                            p: 0.25,
                                                            color: isFilterOpen ? "#0057ff" : "inherit",
                                                            backgroundColor: isFilterOpen ? "#dce8ff" : "transparent",
                                                            borderRadius: "4px",
                                                        }}
                                                    >
                                                        <FilterAltOutlinedIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {totalCount === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={staticHeaders.length}
                                    sx={{ textAlign: "center", py: 6, color: "#68717d", fontSize: 13 }}
                                >
                                    {isFilterOpen && hasActiveFilter
                                        ? "No rows match the filter criteria."
                                        : "No data available."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRows.map(({ row, originalIndex }, vi) => (
                                <TableRow
                                    key={`${originalIndex}-${row["Repair ID"] ?? row["ID"] ?? originalIndex}`}
                                    sx={{
                                        height: 45,
                                        backgroundColor: vi % 2 === 0 ? "#ffffff" : "#f6f7f9",
                                        "&:hover": { backgroundColor: "#eef4ff" },
                                    }}
                                >
                                    {sourceColumns.map((header) => {
                                        const value = header === "Repair ID"
                                            ? (row["Repair ID"] ?? row["ID"] ?? `R${String(originalIndex + 1).padStart(9, "0")}`)
                                            : (row[header] ?? "-");
                                        const displayValue = String(value);
                                        return (
                                            <TableCell
                                                key={header}
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
                                                <Tooltip title={displayValue !== "-" ? displayValue : ""} placement="top">
                                                    <span>{displayValue}</span>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    })}
                                    {[0, 1, 2].map((i) => (
                                        <TableCell key={`status-${i}`} sx={{ borderBottom: "1px solid #dfe3e8" }}>
                                            <StatusCell index={originalIndex} />
                                        </TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ borderBottom: "1px solid #dfe3e8", px: 1 }}>
                                        <Tooltip title="Edit">
                                            <span>
                                                <IconButton disabled size="small">
                                                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: "1px solid #dfe3e8", px: 1 }}>
                                        <Tooltip title="Delete">
                                            <span>
                                                <IconButton disabled size="small">
                                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Click-outside backdrop to close filter popup */}
            {isFilterOpen && (
                <Box
                    sx={{ position: "fixed", inset: 0, zIndex: 1299 }}
                    onClick={handleClose}
                />
            )}

            {/* Filter dropdown */}
            <Popper
                open={isFilterOpen}
                anchorEl={anchorEl}
                placement="bottom-start"
                sx={{ zIndex: 1300 }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        mt: 0.5,
                        minWidth: 180,
                        border: "1px solid #dfe3e8",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                >
                    <Stack direction="row" sx={{ px: 1.5, py: 0.75, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eef0f2" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#68717d", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Filter by status
                        </Typography>
                        <IconButton size="small" onClick={handleClose} sx={{ p: 0.25 }}>
                            <CloseOutlinedIcon sx={{ fontSize: 14, color: "#68717d" }} />
                        </IconButton>
                    </Stack>
                    <Box sx={{ px: 0.5, py: 0.5 }}>
                        {statusOptions.map((status) => {
                            const paletteItem = statusPalette.find((s) => s.label === status)!;
                            const checked = filteredStatuses.indexOf(status) >= 0;
                            return (
                                <FormControlLabel
                                    key={status}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={checked}
                                            onChange={() => handleToggle(status)}
                                            sx={{ py: 0.25, "&.Mui-checked": { color: paletteItem.color } }}
                                        />
                                    }
                                    label={
                                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                            <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: paletteItem.color, flex: "0 0 auto" }} />
                                            <Typography sx={{ fontSize: 12, color: "#1f2933" }}>{status}</Typography>
                                        </Stack>
                                    }
                                    sx={{ mx: 0, width: "100%", "& .MuiFormControlLabel-label": { width: "100%" } }}
                                />
                            );
                        })}
                    </Box>
                    {hasActiveFilter && (
                        <Stack direction="row" sx={{ px: 1.5, py: 0.75, borderTop: "1px solid #eef0f2", justifyContent: "center" }}>
                            <Typography onClick={handleClearFilter} sx={{ fontSize: 11, fontWeight: 600, color: "#0057ff", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                                Clear filter
                            </Typography>
                        </Stack>
                    )}
                </Paper>
            </Popper>

            {/* Pagination */}
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
                    <Typography sx={{ fontSize: 12, color: "#68717d" }}>Rows per page</Typography>
                    <Select
                        value={rowsPerPage}
                        size="small"
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(0);
                        }}
                        IconComponent={KeyboardArrowDownOutlinedIcon}
                        sx={{ height: 32, minWidth: 58, borderRadius: "6px", fontSize: 12, backgroundColor: "#fff" }}
                    >
                        <MenuItem value={30}>30</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                    </Select>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    {pageNumbers.map((p, idx) =>
                        typeof p === "number" ? (
                            <Typography
                                key={p}
                                onClick={() => setPage(p - 1)}
                                sx={{
                                    fontSize: 12,
                                    color: p === page + 1 ? "#0057ff" : "#68717d",
                                    fontWeight: p === page + 1 ? 700 : 400,
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: p !== page + 1 ? "underline" : "none" },
                                }}
                            >
                                {p}
                            </Typography>
                        ) : (
                            <Typography key={`e-${idx}`} sx={{ fontSize: 12, color: "#68717d" }}>
                                ...
                            </Typography>
                        )
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}