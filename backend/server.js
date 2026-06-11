const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db');
const repairsRouter = require('./routes/repairs');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility function to parse Excel file
const parseExcelFile = (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    
    return {
      success: true,
      data: jsonData,
      rowCount: jsonData.length,
      columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const result = parseExcelFile(req.file.buffer);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// Database routes
app.use('/api/repairs', repairsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
