"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Collapse,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { StatusCell } from "./StatusCell";
import { statusPalette } from "../lib/constants";

interface AccordionTableProps {
    rows: any[];
    searchQuery?: string;
}

export function AccordionTable({ rows, searchQuery }: AccordionTableProps) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    const toggle = (index: number) =>
        setExpanded((prev) => (prev === index ? null : index));

    useEffect(() => {
        setPage(0);
    }, [rows.length]);

    const filteredRows = useMemo(() => {
        let result = rows.map((row: any, i: number) => {
            const statusLabel = statusPalette[i % statusPalette.length].label;
            return { row, originalIndex: i, _statusLabel: statusLabel };
        });

        if (searchQuery && searchQuery.trim()) {
            const lowerQuery = searchQuery.trim().toLowerCase();
            result = result.filter(({ row, _statusLabel }) => {
                try {
                    const searchText = JSON.stringify(row) + " " + _statusLabel;
                    return searchText.toLowerCase().includes(lowerQuery);
                } catch {
                    return false;
                }
            });
        }

        return result;
    }, [rows, searchQuery]);

    const visibleRows = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, page, rowsPerPage]);

    const totalCount = filteredRows.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    const pageNumbers: (number | string)[] = (() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | string)[] = [];
        const range = 2;
        const current = page + 1;
        const start = Math.max(1, current - range);
        const end = Math.min(totalPages, current + range);
        if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
        return pages;
    })();

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
            <Stack spacing={1} sx={{ p: 1.5 }}>
                {totalCount === 0 ? (
                    <Typography sx={{ textAlign: "center", py: 6, color: "#68717d", fontSize: 13 }}>
                        No data available.
                    </Typography>
                ) : (
                    visibleRows.map(({ row, originalIndex }) => {
                        const isOpen = expanded === originalIndex;
                        const idx = originalIndex;
                        const repairId = row["Repair ID"] ?? row["ID"] ?? `R${String(originalIndex + 1).padStart(9, "0")}`;

                        return (
                            <Paper
                                key={originalIndex}
                                elevation={0}
                                sx={{
                                    border: "1px solid #dfe3e8",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    sx={{
                                        px: 2.5,
                                        py: 1.5,
                                        alignItems: "center",
                                        cursor: "pointer",
                                        "&:hover": { backgroundColor: "#f8faff" },
                                        minHeight: 52,
                                    }}
                                    onClick={() => toggle(originalIndex)}
                                >
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", width: 130, flexShrink: 0 }}>
                                        {repairId}
                                    </Typography>

                                    <Stack direction="row" sx={{ flex: 1, alignItems: "center", flexWrap: "wrap", gap: "6px 24px" }}>
                                        <Typography sx={{ fontSize: 12, color: "#68717d" }}>Extended to sales org</Typography>
                                        <StatusCell index={idx} />
                                        <Typography sx={{ fontSize: 12, color: "#68717d" }}>Translation done</Typography>
                                        <StatusCell index={idx} />
                                        <Typography sx={{ fontSize: 12, color: "#68717d" }}>Price valid</Typography>
                                        <StatusCell index={idx} />
                                    </Stack>

                                    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" sx={{ color: "#111827" }}>
                                                <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" sx={{ color: "#111827" }}>
                                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton size="small" sx={{ color: "#111827" }} onClick={() => toggle(originalIndex)}>
                                            {isOpen ? <KeyboardArrowUpIcon sx={{ fontSize: 20 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />}
                                        </IconButton>
                                    </Stack>
                                </Stack>

                                <Collapse in={isOpen}>
                                    <Divider />
                                    <Box sx={{ px: 3, py: 2, backgroundColor: "#fff" }}>
                                        <Stack direction="row" spacing={6} sx={{ mb: 1.5 }}>
                                            {["Category 1", "Category 2", "Category 3"].map((col) => (
                                                <Stack key={col} direction="row" spacing={1.5} sx={{ alignItems: "baseline" }}>
                                                    <Typography sx={{ fontSize: 12, color: "#68717d", flexShrink: 0 }}>{col}</Typography>
                                                    <Typography sx={{ fontSize: 13, color: "#111827" }}>{row[col] ?? "—"}</Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                        {["English (EN)", "Netherland (NL)"].map((col) => (
                                            <Stack key={col} direction="row" spacing={2} sx={{ mb: 1, alignItems: "flex-start" }}>
                                                <Typography sx={{ fontSize: 12, color: "#68717d", width: 110, flexShrink: 0, pt: 0.1 }}>{col}</Typography>
                                                <Typography sx={{ fontSize: 12, color: "#111827", flex: 1, lineHeight: 1.7 }}>{row[col] ?? "—"}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Collapse>
                            </Paper>
                        );
                    })
                )}
            </Stack>

            <Stack direction="row" sx={{ minHeight: 56, px: 2, alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e2e6ea" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, color: "#68717d" }}>Rows per page</Typography>
                    <Select
                        value={rowsPerPage}
                        size="small"
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(0);
                        }}
                        IconComponent={KeyboardArrowDownIcon}
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
                            <Typography key={`e-${idx}`} sx={{ fontSize: 12, color: "#68717d" }}>...</Typography>
                        )
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}