"use client";

import { Box, Stack, Typography } from "@mui/material";
import { statusPalette } from "../lib/constants";

function getStatus(index: number) {
    return statusPalette[index % statusPalette.length];
}

export function StatusCell({ index }: { index: number }) {
    const status = getStatus(index);

    return (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box
                component="span"
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: status.color,
                    flex: "0 0 auto",
                }}
            />
            <Typography sx={{ fontSize: 12, color: "#1f2933" }}>
                {status.label}
            </Typography>
        </Stack>
    );
}