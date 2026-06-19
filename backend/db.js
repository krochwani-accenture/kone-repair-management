const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'repairs.db');
let db = null;

// Initialize database schema
async function initializeDatabase() {
  try {
    const SQL = await initSqlJs();

    // Try to load existing database from file
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
    } else {
      db = new SQL.Database();
    }

    // Create repairs table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS repairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repair_id TEXT UNIQUE NOT NULL,
        equipment_type TEXT NOT NULL,
        service_category TEXT NOT NULL,
        base_price REAL NOT NULL,
        service_hours REAL NOT NULL,
        availability TEXT,
        description TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.run(createTableSQL);

    // Create index on repair_id for faster lookups
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_repair_id ON repairs(repair_id);
    `;
    db.run(createIndexSQL);

    // Save database to file
    saveDatabase();
  } catch (error) {
    console.error('[Database] Initialization error:', error.message);
    throw error;
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Export database functions
module.exports = {
  initializeDatabase,
  getDatabase,
  saveDatabase,
};
