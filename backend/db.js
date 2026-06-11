const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'repairs.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  try {
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

    db.exec(createTableSQL);

    // Create index on repair_id for faster lookups
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_repair_id ON repairs(repair_id);
    `;
    db.exec(createIndexSQL);

    console.log('[Database] Initialization complete');
  } catch (error) {
    console.error('[Database] Initialization error:', error.message);
    throw error;
  }
}

// Export database and initialization function
module.exports = {
  db,
  initializeDatabase,
};
