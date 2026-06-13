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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import GetAppIcon from '@mui/icons-material/GetApp';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dbLoading, setDbLoading] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  // Fetch data from database on component mount
  useEffect(() => {
    if (tabValue === 1) {
      fetchDataFromDatabase();
    }
  }, [tabValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
      detectSheets(selectedFile);
    }
  };

  const detectSheets = async (fileToAnalyze: File) => {
    setLoading(true);
    setError(null);
    setAvailableSheets([]);
    setSelectedSheet('');

    try {
      const formData = new FormData();
      formData.append('file', fileToAnalyze);

      const response = await axios.post(`${API_URL}/upload/info`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setAvailableSheets(response.data.sheets);
        setSelectedSheet(response.data.sheets[0] || '');
        setShowSheetSelector(response.data.sheets.length > 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to detect sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedSheet) {
        formData.append('sheetName', selectedSheet);
      }

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedData(response.data);
      setFile(null);
      setFileName('');
      setAvailableSheets([]);
      setSelectedSheet('');
      setShowSheetSelector(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!uploadedData || !uploadedData.data) {
      setError('No data to save. Please upload a file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${REPAIRS_API_URL}/repairs/save`, {
        data: uploadedData.data,
      });

      if (response.data.success) {
        setSuccess(
          `Successfully saved! Inserted: ${response.data.data.inserted}, Skipped: ${response.data.data.skipped}`
        );
        setUploadedData(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save to database');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataFromDatabase = async () => {
    setDbLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${REPAIRS_API_URL}/repairs`);

      if (response.data.success) {
        setDbData(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch from database');
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

        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
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
          {/* Tabs for navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Upload Excel" />
              <Tab label="View Database" />
            </Tabs>
          </Box>

          {/* Error and Success Alerts */}
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

          {/* Tab 1: Upload Section */}
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
                      <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {fileName || 'Click to select an Excel file or drag and drop'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Supported formats: .xlsx, .xls
                        </Typography>
                      </label>
                    </Box>

                    {/* Sheet Selector */}
                    {showSheetSelector && availableSheets.length > 0 && (
                      <Card sx={{ backgroundColor: '#f0f7ff', border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Select Sheet to Upload ({availableSheets.length} sheets available)
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Sheet Name</InputLabel>
                            <Select
                              value={selectedSheet}
                              label="Sheet Name"
                              onChange={(e) => setSelectedSheet(e.target.value)}
                            >
                              {availableSheets.map((sheet) => (
                                <MenuItem key={sheet} value={sheet}>
                                  {sheet}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </CardContent>
                      </Card>
                    )}

                    <Stack direction="row" spacing={2} style={{ justifyContent:"flex-end" }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setFile(null);
                          setFileName('');
                          setError(null);
                          setAvailableSheets([]);
                          setSelectedSheet('');
                          setShowSheetSelector(false);
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
                        {loading ? <CircularProgress size={24} /> : 'Upload File'}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Preview Data */}
              {uploadedData && uploadedData.success && (
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Repair Data Preview
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Total Records: <strong>{uploadedData.rowCount}</strong>
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Columns: <strong>{uploadedData.columns.join(', ')}</strong>
                      </Typography>
                    </Box>

                    {/* Save to Database Button */}
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveToDatabase}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save to Database'}
                      </Button>
                    </Stack>

                    {renderDataTable(
                      uploadedData.data,
                      uploadedData.columns,
                      'Excel Data Preview'
                    )}
                  </CardContent>
                </Card>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 2: Database View */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : dbData && dbData.success && dbData.data.length > 0 ? (
                renderDataTable(dbData.data, Object.keys(dbData.data[0]), 'Database Records')
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
