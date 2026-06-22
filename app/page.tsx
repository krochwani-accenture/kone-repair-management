
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import GetAppIcon from '@mui/icons-material/GetApp';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';
import * as XLSX from 'xlsx';
//import { useAuth } from './hooks/useAuth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');
const REPAIRS_API_URL = process.env.NEXT_PUBLIC_REPAIRS_API_URL || API_URL;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Page() {
  //const auth = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dbLoading, setDbLoading] = useState(false);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelSheets = (fileBuffer: ArrayBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const availableSheets = workbook.SheetNames;
    const sheets: Record<
      string,
      { data: any[]; rowCount: number; columns: string[] }
    > = {};
    let totalRowCount = 0;

    availableSheets.forEach((name) => {
      const sheet = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });
      const columns = data.length > 0 ? Object.keys(data[0] ?? {}) : [];
      sheets[name] = {
        data,
        rowCount: data.length,
        columns,
      };
      totalRowCount += data.length;
    });

    return {
      success: true,
      sheets,
      totalRowCount,
      availableSheets,
    };
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadedData(null);

    try {
      const fileBuffer = await readFileAsArrayBuffer(file);
      const parsed = parseExcelSheets(fileBuffer);
      setUploadedData(parsed);

      const response = await axios.get(`${API_URL}/upload/url`, {
        params: { filename: file.name },
        //headers: auth.getAuthHeader(),
      });

      const { uploadUrl } = response.data;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 upload failed');
      }

      setSuccess('File uploaded successfully. Preview is ready.');
      setFile(null);
      setFileName('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!uploadedData) {
      setError('No data to save. Please upload a file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let dataToSave: any[] = [];

      if (Array.isArray(uploadedData.data)) {
        dataToSave = uploadedData.data;
      } else if (uploadedData.sheets) {
        const sheetNames =
          uploadedData.availableSheets && uploadedData.availableSheets.length
            ? uploadedData.availableSheets
            : Object.keys(uploadedData.sheets);
        sheetNames.forEach((name: string) => {
          const s = uploadedData.sheets[name];
          if (s && Array.isArray(s.data)) dataToSave.push(...s.data);
        });
      }

      if (dataToSave.length === 0) {
        setError('No rows found to save.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${REPAIRS_API_URL}/repairs/save`,
        {
          data: dataToSave,
        }
      );

      if (response.data.success) {
        setSuccess(
          `Successfully saved! Inserted: ${response.data.data.inserted}, Updated: ${response.data.data.updated ?? 0}, Unchanged: ${response.data.data.unchanged ?? 0}, Skipped: ${response.data.data.skipped}`
        );
        setUploadedData(null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to save to database'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDataFromDatabase = async () => {
    setDbLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${REPAIRS_API_URL}/repairs`, {});

      if (response.data.success) {
        setDbData(response.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to fetch from database'
      );
    } finally {
      setDbLoading(false);
    }
  };

  const renderDataTable = (data: any[], columns: string[], title: string) => (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          {title}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Total Records: <strong>{data.length}</strong>
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          sx={{ maxHeight: 600, overflow: 'auto' }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                {columns.map((column: string) => (
                  <TableCell
                    key={column}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      minWidth: 120,
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row: any, index: number) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                  }}
                >
                  {columns.map((column: string) => (
                    <TableCell key={`${index}-${column}`}>
                      {String(row[column] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Kone Repair Offering & Pricing Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>

        <Stack spacing={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(_event, newValue) => setTabValue(newValue)}
            >
              <Tab label="Upload Excel" />
              <Tab label="View Database" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Upload Repair Data
                  </Typography>


                  <Stack spacing={2}>
                    <Box
                      sx={{
                        border: '2px dashed #1976d2',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          borderColor: '#0d47a1',
                        },
                      }}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        style={{ cursor: 'pointer', display: 'block' }}
                      >
                        <CloudUploadIcon
                          sx={{ fontSize: 48, color: '#1976d2', mb: 1 }}
                        />
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {fileName ||
                            'Click to select an Excel file or drag and drop'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Supported formats: .xlsx, .xls
                        </Typography>
                      </label>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={2}
                      style={{ justifyContent: 'flex-end' }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setFile(null);
                          setFileName('');
                          setError(null);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={!file || loading}
                        sx={{ minWidth: 150 }}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Upload File'
                        )}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {uploadedData &&
                uploadedData.success &&
                (uploadedData.data || uploadedData.sheets) && (
                  <Card elevation={2}>
                    <CardContent>
                      <Typography
                        variant="h5"
                        sx={{ mb: 2, fontWeight: 'bold' }}
                      >
                        Repair Data Preview
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        {uploadedData && uploadedData.sheets ? (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              Total Records:{' '}
                              <strong>{uploadedData.totalRowCount}</strong>
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Sheets:{' '}
                              <strong>
                                {(
                                  uploadedData.availableSheets ||
                                  Object.keys(uploadedData.sheets)
                                ).join(', ')}
                              </strong>
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              Total Records:{' '}
                              <strong>{uploadedData.rowCount}</strong>
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Columns:{' '}
                              <strong>
                                {uploadedData.columns.join(', ')}
                              </strong>
                            </Typography>
                          </>
                        )}
                      </Box>

                      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveToDatabase}
                          disabled={loading}
                        >
                          {loading ? (
                            <CircularProgress size={24} />
                          ) : (
                            'Save to Database'
                          )}
                        </Button>
                      </Stack>

                      {(() => {
                        if (uploadedData && uploadedData.sheets) {
                          const sheetNames =
                            uploadedData.availableSheets &&
                              uploadedData.availableSheets.length
                              ? uploadedData.availableSheets
                              : Object.keys(uploadedData.sheets);

                          const mergedData: any[] = [];
                          const columnsSet = new Set<string>();

                          sheetNames.forEach((name: string) => {
                            const sheet = uploadedData.sheets[name];
                            if (sheet && Array.isArray(sheet.data)) {
                              sheet.data.forEach((row: any) => {
                                mergedData.push(row);
                                Object.keys(row).forEach((key) =>
                                  columnsSet.add(key)
                                );
                              });
                            }
                          });

                          const mergedColumns = Array.from(columnsSet);
                          return renderDataTable(
                            mergedData,
                            mergedColumns,
                            'Excel Data Preview'
                          );
                        }

                        return renderDataTable(
                          uploadedData.data,
                          uploadedData.columns,
                          'Excel Data Preview'
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Database Records
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<GetAppIcon />}
                  onClick={fetchDataFromDatabase}
                  disabled={dbLoading}
                >
                  {dbLoading ? <CircularProgress size={24} /> : 'Refresh'}
                </Button>
              </Box>

              {dbLoading && !dbData ? (
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                >
                  <CircularProgress />
                </Box>
              ) : dbData &&
                dbData.success &&
                Array.isArray(dbData.data) &&
                dbData.data.length > 0 ? (
                renderDataTable(
                  dbData.data,
                  Object.keys(dbData.data[0]),
                  'Database Records'
                )
              ) : dbData && dbData.success ? (
                <Alert severity="info">No records found in database</Alert>
              ) : null}
            </Stack>
          </TabPanel>
        </Stack>

      </Container>
    </>
  );
}
