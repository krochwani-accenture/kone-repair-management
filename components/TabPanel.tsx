"use client";

import { Box } from "@mui/material";
import { TabPanelProps } from "../lib/constants";

export function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <div hidden={value !== index} style={{ width: "100%" }}>
            {value === index && <Box>{children}</Box>}
        </div>
    );
}