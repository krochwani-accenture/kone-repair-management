"use client";

import { useState } from "react";
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


export function AccordionTable({ rows }: { rows: any[] }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    const toggle = (index: number) =>
        setExpanded((prev) => (prev === index ? null : index));

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
                {rows.map((row, index) => {
                    const isOpen = expanded === index;
                    const repairId =
                        row["Repair ID"] ??
                        `R${String(index + 1).padStart(9, "0")}`;

                    return (
                        <Paper
                            key={index}
                            elevation={0}
                            sx={{
                                border: "1px solid #dfe3e8",
                                borderRadius: "10px",
                                overflow: "hidden",
                                backgroundColor: "#fff",
                            }}
                        >
                            {/* Summary row */}
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
                                onClick={() => toggle(index)}
                            >
                                {/* Repair ID */}
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#111827",
                                        width: 130,
                                        flexShrink: 0,
                                    }}
                                >
                                    {repairId}
                                </Typography>

                                {/* Status columns */}
                                <Stack
                                    direction="row"
                                    sx={{
                                        flex: 1,
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "6px 24px",
                                    }}
                                >
                                    <Typography
                                        sx={{ fontSize: 12, color: "#68717d" }}
                                    >
                                        Extended to sales org
                                    </Typography>
                                    <StatusCell index={index} />

                                    <Typography
                                        sx={{ fontSize: 12, color: "#68717d" }}
                                    >
                                        Translation done
                                    </Typography>
                                    <StatusCell index={index} />

                                    <Typography
                                        sx={{ fontSize: 12, color: "#68717d" }}
                                    >
                                        Price valid
                                    </Typography>
                                    <StatusCell index={index} />
                                </Stack>

                                {/* Actions */}
                                <Stack
                                    direction="row"
                                    spacing={0.25}
                                    sx={{ alignItems: "center", flexShrink: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Tooltip title="Edit">
                                        <IconButton
                                            size="small"
                                            sx={{ color: "#111827" }}
                                        >
                                            <EditOutlinedIcon
                                                sx={{ fontSize: 17 }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            sx={{ color: "#111827" }}
                                        >
                                            <DeleteOutlineOutlinedIcon
                                                sx={{ fontSize: 17 }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton
                                        size="small"
                                        sx={{ color: "#111827" }}
                                        onClick={() => toggle(index)}
                                    >
                                        {isOpen ? (
                                            <KeyboardArrowUpIcon
                                                sx={{ fontSize: 20 }}
                                            />
                                        ) : (
                                            <KeyboardArrowDownIcon
                                                sx={{ fontSize: 20 }}
                                            />
                                        )}
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {/* Expanded details */}
                            <Collapse in={isOpen}>
                                <Divider />
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 2,
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    {/* Categories row — 3 columns inline */}
                                    <Stack
                                        direction="row"
                                        spacing={6}
                                        sx={{ mb: 1.5 }}
                                    >
                                        {["Category 1", "Category 2", "Category 3"].map((col) => (
                                            <Stack
                                                key={col}
                                                direction="row"
                                                spacing={1.5}
                                                sx={{ alignItems: "baseline" }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 12,
                                                        color: "#68717d",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {col}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {row[col] ?? "—"}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>

                                    {/* English & Netherland — full-width text blocks */}
                                    {["English (EN)", "Netherland (NL)"].map((col) => (
                                        <Stack
                                            key={col}
                                            direction="row"
                                            spacing={2}
                                            sx={{
                                                mb: 1,
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    color: "#68717d",
                                                    width: 110,
                                                    flexShrink: 0,
                                                    pt: 0.1,
                                                }}
                                            >
                                                {col}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    color: "#111827",
                                                    flex: 1,
                                                    lineHeight: 1.7,
                                                }}
                                            >
                                                {row[col] ?? "—"}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })}
            </Stack>

            {/* Pagination footer */}
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
                        IconComponent={KeyboardArrowDownIcon}
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
