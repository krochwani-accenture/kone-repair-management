"use client";

import { Box, Stack, Typography, Tabs, Tab, Tooltip, IconButton } from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { appNavItems } from "../lib/constants";

interface AppHeaderProps {
    tabValue: number;
    onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export function AppHeader({ tabValue, onTabChange }: AppHeaderProps) {
    return (
        <Box
            component="header"
            sx={{
                height: 48,
                backgroundColor: "#fff",
                borderBottom: "3px solid #0057ff",
                display: "flex",
                alignItems: "center",
                px: 1.25,
            }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        width: 66,
                        height: 26,
                        backgroundColor: "#0057ff",
                        color: "#fff",
                        border: "1px solid #0057ff",
                    }}
                >
                    {["K", "O", "N", "E"].map((letter) => (
                        <Box
                            key={letter}
                            sx={{
                                display: "grid",
                                placeItems: "center",
                                borderRight: letter === "E" ? 0 : "1px solid #fff",
                                fontSize: 15,
                                fontWeight: 800,
                                lineHeight: 1,
                            }}
                        >
                            {letter}
                        </Box>
                    ))}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    Kone repairs
                </Typography>
            </Stack>

            <Tabs
                value={tabValue}
                onChange={onTabChange}
                sx={{
                    ml: 4,
                    minHeight: 45,
                    "& .MuiTabs-indicator": {
                        height: 3,
                        backgroundColor: "#0057ff",
                    },
                    "& .MuiTab-root": {
                        minHeight: 45,
                        px: 2,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                        textTransform: "none",
                    },
                    "& .Mui-selected": {
                        color: "#0057ff !important",
                    },
                }}
            >
                {appNavItems.map((item) => (
                    <Tab key={item} label={item} />
                ))}
            </Tabs>

            <Tooltip title="Profile">
                <IconButton
                    size="small"
                    sx={{
                        ml: "auto",
                        width: 30,
                        height: 30,
                        borderRadius: "4px",
                        border: "1px dashed #0057ff",
                        color: "#0057ff",
                    }}
                >
                    <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}