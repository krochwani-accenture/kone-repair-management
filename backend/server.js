const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db');
const repairsRouter = require('./routes/repairs');
const { loginHandler, authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database asynchronously
let dbReady = false;

(async () => {
  await initializeDatabase();
  dbReady = true;
  console.log('[Server] Database ready');
})();

// Middleware
app.use(cors());
app.use(express.json());

// Check if database is ready
app.use((req, res, next) => {
  if (!dbReady && !req.path.includes('/health')) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility function to get all sheet names from Excel file
const getExcelSheets = (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    return {
      success: true,
      sheets: workbook.SheetNames,
      count: workbook.SheetNames.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Utility function to parse Excel file with optional sheet selection
const parseExcelFile = (fileBuffer, sheetName = null) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // If a sheetName is provided and exists, return that single sheet (backwards compatible)
    if (sheetName && workbook.SheetNames.includes(sheetName)) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      return {
        success: true,
        data: jsonData,
        rowCount: jsonData.length,
        columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
        sheetName: sheetName,
        availableSheets: workbook.SheetNames
      };
    }

    // Otherwise, parse all sheets and return them as a map
    const sheetsResult = {};
    let totalRows = 0;

    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      sheetsResult[name] = {
        data: jsonData,
        rowCount: jsonData.length,
        columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
      };
      totalRows += jsonData.length;
    });

    return {
      success: true,
      sheets: sheetsResult,
      totalRowCount: totalRows,
      availableSheets: workbook.SheetNames
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Sheet info endpoint - get available sheets
app.post('/api/upload/info', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const result = getExcelSheets(req.file.buffer);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// Upload endpoint - supports optional sheet selection
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const parser = require('lambda-multipart-parser');

  const parsed = await parser.parse(event);

  const file = parsed.files[0];

  const sheetName = parsed.sheetName || null;

  const result = parseExcelFile(
    file.content,
    sheetName
  );

  res.json(result);
});

// Auth routes (public)
app.post('/api/auth/login', loginHandler);

// Database routes (protected)
app.use('/api/repairs', authMiddleware, repairsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
