const { getDatabase, saveDatabase } = require('../db');

/**
 * Save repair records to database
 * Skips duplicates based on repair_id
 */
function saveRepairsToDatabase(repairs) {
  try {
    const db = getDatabase();
    
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (const repair of repairs) {
      try {
        // Validate required fields
        if (!repair['Repair ID']) {
          errors.push('Missing Repair ID');
          skipped++;
          continue;
        }

        // Check if repair_id already exists
        const checkResult = db.exec(
          `SELECT id FROM repairs WHERE repair_id = ?`,
          [repair['Repair ID']]
        );

        if (checkResult.length > 0 && checkResult[0].values.length > 0) {
          skipped++;
          continue;
        }

        // Insert repair record
        const params = [
          repair['Repair ID'],
          repair['Equipment Type'] || '',
          repair['Service Category'] || '',
          parseFloat(repair['Base Price']) || 0,
          parseFloat(repair['Service Hours']) || 0,
          repair['Availability'] || '',
          repair['Description'] || '',
          repair['Notes'] || ''
        ];

        db.run(
          `INSERT INTO repairs (
            repair_id, equipment_type, service_category, 
            base_price, service_hours, availability, description, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params
        );

        inserted++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Save database to file
    saveDatabase();

    return { inserted, skipped, errors };
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
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM repairs ORDER BY created_at DESC');
    const result = stmt.getAsObject();
    return result;
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
    const db = getDatabase();
    const results = db.exec(
      'SELECT * FROM repairs WHERE repair_id = ?',
      [repairId]
    );
    
    if (results.length === 0) return null;
    if (results[0].values.length === 0) return null;

    // Convert result array to object
    const columns = results[0].columns;
    const values = results[0].values[0];
    const repair = {};
    columns.forEach((col, idx) => {
      repair[col] = values[idx];
    });
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
    const db = getDatabase();
    const result = db.exec('SELECT COUNT(*) as count FROM repairs');
    if (result.length === 0) return 0;
    return result[0].values[0][0];
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
    const db = getDatabase();
    db.run('DELETE FROM repairs');
    saveDatabase();
    return true;
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
