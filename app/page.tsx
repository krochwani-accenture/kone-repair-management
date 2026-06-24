"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, Container, Stack, Typography, Alert } from "@mui/material";
import { AppHeader } from "../components/AppHeader";
import { ToolbarActions } from "../components/ToolbarActions";
import { FileUploadBar } from "../components/FileUploadBar";
import { TabPanel } from "../components/TabPanel";
import { ManageOfferPanel } from "../components/TabPanels/ManageOfferPanel";
import { ManagePricePanel } from "../components/TabPanels/ManagePricePanel";
import { DiffPricePanel } from "../components/TabPanels/DiffPricePanel";
import { useFileUpload } from "./hooks/useFileUpload";
import { useDatabase } from "./hooks/useDatabase";
import { collectAllRows } from "../lib/excelParser";

export default function Page() {
  const [tabValue, setTabValue] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const upload = useFileUpload();
  const database = useDatabase();

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
      if (newValue === 1) {
        database.fetchDataFromDatabase();
      }
    },
    [database]
  );

  const handleSaveToDatabase = useCallback(() => {
    database.handleSaveToDatabase(upload.uploadedData);
  }, [database, upload.uploadedData]);

  const handleUpload = useCallback(() => {
    upload.handleUpload();
  }, [upload]);

  const handleClear = useCallback(() => {
    upload.clearFile();
  }, [upload]);

  const hasNotification = !!(upload.error || database.error || upload.success || database.success);

  useEffect(() => {
    if (!hasNotification) return;
    const timer = setTimeout(() => {
      upload.clearMessages();
      database.clearMessages();
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasNotification, upload, database]);

  const uploadedRows = collectAllRows(upload.uploadedData);

  const databaseRows =
    database.dbData?.success && Array.isArray(database.dbData.data)
      ? database.dbData.data
      : [];

  const tableRows = uploadedRows.length > 0 ? uploadedRows : databaseRows;
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <AppHeader tabValue={tabValue} onTabChange={handleTabChange} />

      <Container maxWidth={false} sx={{ px: 2, py: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{ fontSize: 22, fontWeight: 500, color: "#111" }}
            >
              Manage offer
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: {
                  xs: "flex-start",
                  md: "flex-end",
                },
              }}
            >
              <ToolbarActions
                onFileChange={upload.handleFileChange}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
            </Stack>
          </Stack>

          <FileUploadBar
            fileName={upload.fileName}
            loading={upload.loading}
            hasFile={!!upload.file}
            onUpload={handleUpload}
            onClear={handleClear}
          />

          {(upload.error || database.error) && (
            <Alert
              severity="error"
              onClose={() => {
                upload.clearMessages();
                database.clearMessages();
              }}
            >
              {upload.error || database.error}
            </Alert>
          )}

          {(upload.success || database.success) && (
            <Alert
              severity="success"
              onClose={() => {
                upload.clearMessages();
                database.clearMessages();
              }}
            >
              {upload.success || database.success}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <ManageOfferPanel
              rows={tableRows}
              uploadedRows={uploadedRows}
              dbLoading={database.dbLoading}
              onSaveToDatabase={handleSaveToDatabase}
              searchQuery={searchValue}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ManagePricePanel
              rows={tableRows}
              dbLoading={database.dbLoading}
              onRefresh={database.fetchDataFromDatabase}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <DiffPricePanel rows={tableRows} />
          </TabPanel>
        </Stack>
      </Container>
    </Box>
  );
}