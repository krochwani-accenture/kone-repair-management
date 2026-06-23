
'use client';

import { useState } from 'react';
import {
  Box,
  Button,
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
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import axios from 'axios';
import * as XLSX from 'xlsx';
//import { useAuth } from './hooks/useAuth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');
const REPAIRS_API_URL = process.env.NEXT_PUBLIC_REPAIRS_API_URL || API_URL;
const AUTH_BYPASSED = true;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const appNavItems = ['Manage Offer', 'Manage price', 'Differentiate price'];

const compactButtonSx = {
  height: 32,
  borderRadius: '16px',
  px: 1.5,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'none',
};

const statusPalette = [
  { label: 'Completed', color: '#17bf63' },
  { label: 'Pending', color: '#9aa0a6' },
  { label: 'In-progress', color: '#fb8500' },
  { label: 'Error', color: '#dc2626' },
];

function getStatus(index: number) {
  return statusPalette[index % statusPalette.length];
}

function StatusCell({ index }: { index: number }) {
  const status = getStatus(index);

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: status.color,
          flex: '0 0 auto',
        }}
      />
      <Typography sx={{ fontSize: 12, color: '#1f2933' }}>
        {status.label}
      </Typography>
    </Stack>
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

      if (AUTH_BYPASSED) {
        setSuccess('File loaded successfully. Preview is ready.');
        setFile(null);
        setFileName('');
        return;
      }

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

  const renderDataTable = (data: any[], columns: string[]) => {
    const sourceColumns = columns.slice(0, 6);
    const headers = [
      'Repair ID',
      'Category 1',
      'Category 2',
      'Category 3',
      'English (EN)',
      'Netherland (NL)',
    ];

    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderTop: '1px solid #c9ced6',
          backgroundColor: 'transparent',
          overflow: 'hidden',
        }}
      >
        <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {headers.map((column, index) => (
                  <TableCell
                    key={column}
                    sx={{
                      width: index === 0 ? 95 : 128,
                      py: 1.1,
                      px: 2,
                      backgroundColor: '#f8f9fb',
                      borderBottom: '1px solid #bfc5ce',
                      color: '#151a22',
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: 'center' }}
                    >
                      <span>{column}</span>
                      {index > 0 && index < 4 && (
                        <SwapVertOutlinedIcon sx={{ fontSize: 15 }} />
                      )}
                    </Stack>
                  </TableCell>
                ))}

                {['Extended to sales org', 'Translation done', 'Price valid'].map(
                  (column) => (
                    <TableCell
                      key={column}
                      sx={{
                        width: 118,
                        py: 1.1,
                        px: 2,
                        backgroundColor: '#f8f9fb',
                        borderBottom: '1px solid #bfc5ce',
                        color: '#151a22',
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <span>{column}</span>
                        <FilterAltOutlinedIcon sx={{ fontSize: 14 }} />
                      </Stack>
                    </TableCell>
                  )
                )}

                {['Edit', 'Delete'].map((column) => (
                  <TableCell
                    key={column}
                    align="center"
                    sx={{
                      width: 64,
                      py: 1.1,
                      px: 1,
                      backgroundColor: '#f8f9fb',
                      borderBottom: '1px solid #bfc5ce',
                      color: '#151a22',
                      fontSize: 11,
                      fontWeight: 700,
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
                    height: 45,
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f6f7f9',
                    '&:hover': { backgroundColor: '#eef4ff' },
                  }}
                >
                  {headers.map((header, columnIndex) => {
                    const sourceColumn = sourceColumns[columnIndex];
                    const value = sourceColumn ? row[sourceColumn] : '';

                    return (
                      <TableCell
                        key={`${index}-${header}`}
                        sx={{
                          px: 2,
                          py: 1,
                          borderBottom: '1px solid #dfe3e8',
                          color: '#252b35',
                          fontSize: 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {String(value || '-')}
                      </TableCell>
                    );
                  })}

                  <TableCell sx={{ borderBottom: '1px solid #dfe3e8' }}>
                    <StatusCell index={index} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #dfe3e8' }}>
                    <StatusCell index={index} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #dfe3e8' }}>
                    <StatusCell index={index} />
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ borderBottom: '1px solid #dfe3e8', px: 1 }}
                  >
                    <Tooltip title="Edit">
                      <IconButton size="small" sx={{ color: '#111827' }}>
                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ borderBottom: '1px solid #dfe3e8', px: 1 }}
                  >
                    <Tooltip title="Delete">
                      <IconButton size="small" sx={{ color: '#111827' }}>
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          direction="row"
          sx={{
            minHeight: 56,
            px: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e6ea',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#68717d' }}>
              Rows per page
            </Typography>
            <Select
              value={30}
              size="small"
              IconComponent={KeyboardArrowDownOutlinedIcon}
              sx={{
                height: 32,
                minWidth: 58,
                borderRadius: '6px',
                fontSize: 12,
                backgroundColor: '#fff',
              }}
            >
              <MenuItem value={30}>30</MenuItem>
            </Select>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#0057ff' }}>1</Typography>
            <Typography sx={{ fontSize: 12 }}>2</Typography>
            <Typography sx={{ fontSize: 12 }}>3</Typography>
            <Typography sx={{ fontSize: 12 }}>4</Typography>
            <Typography sx={{ fontSize: 12 }}>5</Typography>
            <Typography sx={{ fontSize: 12, color: '#68717d' }}>...</Typography>
            <Typography sx={{ fontSize: 12 }}>10</Typography>
          </Stack>
        </Stack>
      </Paper>
    );
  };

  const uploadedRows =
    uploadedData?.sheets && uploadedData.availableSheets
      ? uploadedData.availableSheets.flatMap(
          (name: string) => uploadedData.sheets[name]?.data ?? []
        )
      : Array.isArray(uploadedData?.data)
        ? uploadedData.data
        : [];

  const uploadedColumns: string[] =
    uploadedRows.length > 0
      ? (Array.from(
          uploadedRows.reduce((keys: Set<string>, row: any) => {
            Object.keys(row).forEach((key) => keys.add(key));
            return keys;
          }, new Set<string>())
        ) as string[])
      : [];

  const databaseRows =
    dbData?.success && Array.isArray(dbData.data) ? dbData.data : [];
  const tableRows = uploadedRows.length > 0 ? uploadedRows : databaseRows;
  const tableColumns: string[] =
    uploadedColumns.length > 0
      ? uploadedColumns
      : databaseRows.length > 0
        ? Object.keys(databaseRows[0])
        : [];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
      <Box
        component="header"
        sx={{
          height: 48,
          backgroundColor: '#fff',
          borderBottom: '3px solid #0057ff',
          display: 'flex',
          alignItems: 'center',
          px: 1.25,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              width: 66,
              height: 26,
              backgroundColor: '#0057ff',
              color: '#fff',
              border: '1px solid #0057ff',
            }}
          >
            {['K', 'O', 'N', 'E'].map((letter) => (
              <Box
                key={letter}
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  borderRight: letter === 'E' ? 0 : '1px solid #fff',
                  fontSize: 15,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {letter}
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            Kone repairs
          </Typography>
        </Stack>

        <Tabs
          value={tabValue}
          onChange={(_event, newValue) => {
            setTabValue(newValue);
            if (newValue === 1) {
              fetchDataFromDatabase();
            }
          }}
          sx={{
            ml: 4,
            minHeight: 45,
            '& .MuiTabs-indicator': {
              height: 3,
              backgroundColor: '#0057ff',
            },
            '& .MuiTab-root': {
              minHeight: 45,
              px: 2,
              fontSize: 13,
              fontWeight: 700,
              color: '#111827',
              textTransform: 'none',
            },
            '& .Mui-selected': {
              color: '#0057ff !important',
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
              ml: 'auto',
              width: 30,
              height: 30,
              borderRadius: '4px',
              border: '1px dashed #0057ff',
              color: '#0057ff',
            }}
          >
            <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Container maxWidth={false} sx={{ px: 2, py: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: 22, fontWeight: 500, color: '#111' }}>
              Manage offer
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
              }}
            >
              <Button
                variant="text"
                startIcon={<FilterAltOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{
                  ...compactButtonSx,
                  backgroundColor: '#eef4ff',
                  color: '#0057ff',
                  '&:hover': { backgroundColor: '#e1ebff' },
                }}
              >
                Filter
              </Button>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="figma-file-input"
              />
              <Button
                component="label"
                htmlFor="figma-file-input"
                variant="text"
                startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{
                  ...compactButtonSx,
                  backgroundColor: '#eef4ff',
                  color: '#0057ff',
                  '&:hover': { backgroundColor: '#e1ebff' },
                }}
              >
                Upload
              </Button>

              <Select
                value="Netherland"
                size="small"
                IconComponent={KeyboardArrowDownOutlinedIcon}
                sx={{
                  height: 32,
                  minWidth: 150,
                  borderRadius: '7px',
                  backgroundColor: '#fff',
                  fontSize: 12,
                  color: '#68717d',
                }}
              >
                <MenuItem value="Netherland">Netherland</MenuItem>
              </Select>

              <TextField
                size="small"
                placeholder="Search"
                sx={{
                  width: 170,
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    borderRadius: '16px',
                    backgroundColor: '#fff',
                    fontSize: 12,
                    pr: 0.5,
                  },
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchOutlinedIcon sx={{ fontSize: 17 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Stack>

          {fileName && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Typography sx={{ fontSize: 12, color: '#68717d' }}>
                Selected file: <strong>{fileName}</strong>
              </Typography>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!file || loading}
                startIcon={
                  loading ? <CircularProgress size={14} /> : <CloudUploadIcon />
                }
                sx={{
                  ...compactButtonSx,
                  borderRadius: '7px',
                  width: 118,
                  backgroundColor: '#0057ff',
                }}
              >
                Load
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setFile(null);
                  setFileName('');
                  setError(null);
                }}
                sx={{ ...compactButtonSx, borderRadius: '7px', width: 86 }}
              >
                Clear
              </Button>
            </Stack>
          )}

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
            {tableRows.length > 0 ? (
              <Stack spacing={1.5}>
                {uploadedRows.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={
                        loading ? <CircularProgress size={14} /> : <SaveIcon />
                      }
                      onClick={handleSaveToDatabase}
                      disabled={loading}
                      sx={{ ...compactButtonSx, borderRadius: '7px' }}
                    >
                      Save to Database
                    </Button>
                    <Typography sx={{ fontSize: 12, color: '#68717d' }}>
                      {uploadedRows.length} uploaded rows ready
                    </Typography>
                  </Stack>
                )}
                {renderDataTable(tableRows, tableColumns)}
              </Stack>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 430,
                  borderRadius: 0,
                  border: '1px dashed #b9c2d0',
                  backgroundColor: '#fff',
                }}
              >
                <Stack spacing={2} sx={{ alignItems: 'center' }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#0057ff' }} />
                  <Typography sx={{ fontSize: 14, color: '#111827' }}>
                    Select an Excel file with the Upload action.
                  </Typography>
                </Stack>
              </Paper>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={1.5}>
              <Button
                variant="text"
                onClick={fetchDataFromDatabase}
                disabled={dbLoading}
                startIcon={
                  dbLoading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <FilterAltOutlinedIcon />
                  )
                }
                sx={{
                  ...compactButtonSx,
                  alignSelf: 'flex-start',
                  backgroundColor: '#eef4ff',
                  color: '#0057ff',
                }}
              >
                Refresh
              </Button>
              {databaseRows.length > 0 ? (
                renderDataTable(databaseRows, tableColumns)
              ) : dbLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Alert severity="info">No records found in database</Alert>
              )}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {tableRows.length > 0 ? (
              renderDataTable(tableRows, tableColumns)
            ) : (
              <Alert severity="info">No records available yet.</Alert>
            )}
          </TabPanel>
        </Stack>
      </Container>
    </Box>
  );
}
