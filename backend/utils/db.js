const { db } = require('../db');

/**
 * Save repair records to database
 * Skips duplicates based on repair_id
 */
function saveRepairsToDatabase(repairs) {
  try {
    const insertStmt = db.prepare(`
      INSERT INTO repairs (
        repair_id, equipment_type, service_category, 
        base_price, service_hours, availability, description, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((repairsArray) => {
      let inserted = 0;
      let skipped = 0;
      const errors = [];

      for (const repair of repairsArray) {
        try {
          // Validate required fields
          if (!repair['Repair ID']) {
            errors.push('Missing Repair ID');
            skipped++;
            continue;
          }

          const result = insertStmt.run(
            repair['Repair ID'],
            repair['Equipment Type'] || '',
            repair['Service Category'] || '',
            parseFloat(repair['Base Price']) || 0,
            parseFloat(repair['Service Hours']) || 0,
            repair['Availability'] || '',
            repair['Description'] || '',
            repair['Notes'] || ''
          );

          inserted++;
        } catch (err) {
          // Catch duplicate key errors
          if (err.message.includes('UNIQUE constraint failed')) {
            skipped++;
          } else {
            errors.push(err.message);
          }
        }
      }

      return { inserted, skipped, errors };
    });

    return transaction(repairs);
  } catch (error) {
    console.error('[Database] Save error:', error);
    throw new Error(`Failed to save repairs: ${error.message}`);
  }
}

/**
 * Fetch all repair records from database
 */
function getAllRepairs() {
  try {
    const stmt = db.prepare('SELECT * FROM repairs ORDER BY created_at DESC');
    const repairs = stmt.all();
    return repairs;
  } catch (error) {
    console.error('[Database] Fetch error:', error);
    throw new Error(`Failed to fetch repairs: ${error.message}`);
  }
}

/**
 * Fetch repair by ID
 */
function getRepairById(repairId) {
  try {
    const stmt = db.prepare('SELECT * FROM repairs WHERE repair_id = ?');
    const repair = stmt.get(repairId);
    return repair;
  } catch (error) {
    console.error('[Database] Fetch by ID error:', error);
    throw new Error(`Failed to fetch repair: ${error.message}`);
  }
}

/**
 * Get total count of repairs in database
 */
function getRepairCount() {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM repairs');
    const result = stmt.get();
    return result.count;
  } catch (error) {
    console.error('[Database] Count error:', error);
    throw new Error(`Failed to get repair count: ${error.message}`);
  }
}

/**
 * Clear all repairs from database (useful for testing)
 */
function clearAllRepairs() {
  try {
    const stmt = db.prepare('DELETE FROM repairs');
    const result = stmt.run();
    return result.changes;
  } catch (error) {
    console.error('[Database] Clear error:', error);
    throw new Error(`Failed to clear repairs: ${error.message}`);
  }
}

module.exports = {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
};
