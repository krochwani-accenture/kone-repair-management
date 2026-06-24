"use client";

import { useState } from "react";
import {
    Stack,
    Button,
    Typography,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";
import { DataTable } from "../DataTable";
import { AccordionTable } from "../AccordionTable";
import { EmptyState } from "../EmptyState";
import { compactButtonSx } from "../../lib/constants";

interface ManageOfferPanelProps {
    rows: any[];
    uploadedRows: any[];
    dbLoading: boolean;
    onSaveToDatabase: () => void;
    searchQuery?: string;
}

export function ManageOfferPanel({
    rows,
    uploadedRows,
    dbLoading,
    onSaveToDatabase,
    searchQuery,
}: ManageOfferPanelProps) {
    const [view, setView] = useState<"table" | "accordion">("table");

    return (

        <Stack spacing={1.5}>
            {/* Toolbar row */}
            <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
                {/* Save button (left) */}
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {uploadedRows.length > 0 && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={
                                    dbLoading ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <SaveIcon />
                                    )
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
                        </>
                    )}
                </Stack>

                {/* View toggle (top-right corner) */}
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 11, color: "#68717d" }}>
                        View
                    </Typography>
                    <ToggleButtonGroup
                        value={view}
                        exclusive
                        size="small"
                        onChange={(_e, val) => val && setView(val)}
                        sx={{
                            "& .MuiToggleButton-root": {
                                px: 1.2,
                                py: 0.5,
                                borderColor: "#dfe3e8",
                                color: "#68717d",
                                textTransform: "none",
                                "&.Mui-selected": {
                                    backgroundColor: "#0057ff",
                                    color: "#fff",
                                    "&:hover": { backgroundColor: "#0046cc" },
                                },
                            },
                        }}
                    >
                        <Tooltip title="Simple rows">
                            <ToggleButton value="table">
                                <TableRowsOutlinedIcon sx={{ fontSize: 18 }} />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Accordion (expandable rows)">
                            <ToggleButton value="accordion">
                                <UnfoldMoreOutlinedIcon sx={{ fontSize: 18 }} />
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>
                </Stack>
            </Stack>

            {/* Content */}
            {uploadedRows.length === 0 && rows.length === 0 ? (
                <EmptyState />
            ) : view === "table" ? (
                <DataTable rows={rows} searchQuery={searchQuery} />
            ) : (
                <AccordionTable rows={rows} searchQuery={searchQuery} />
            )}

        </Stack>
    );
}
