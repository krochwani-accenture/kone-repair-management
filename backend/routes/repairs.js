const express = require('express');
const router = express.Router();
const {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
} = require('../utils/db');

/**
 * POST /api/repairs/save
 * Save parsed repair data to database
 * Body: { data: array of repair objects }
 */
router.post('/save', (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format. Expected array of repair objects.',
      });
    }

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data to save.',
      });
    }

    const result = saveRepairsToDatabase(data);

    res.json({
      success: true,
      message: `Successfully saved repair data`,
      data: {
        inserted: result.inserted,
        skipped: result.skipped,
        total: data.length,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[API] Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save repairs to database',
    });
  }
});

/**
 * GET /api/repairs
 * Fetch all repairs from database
 */
router.get('/', (req, res) => {
  try {
    const repairs = getAllRepairs();
    const count = getRepairCount();

    res.json({
      success: true,
      data: repairs,
      count: count,
      message: `Retrieved ${count} repairs from database`,
    });
  } catch (error) {
    console.error('[API] Fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repairs from database',
    });
  }
});

/**
 * GET /api/repairs/:repairId
 * Fetch specific repair by ID
 */
router.get('/:repairId', (req, res) => {
  try {
    const { repairId } = req.params;

    if (!repairId) {
      return res.status(400).json({
        success: false,
        error: 'Repair ID is required',
      });
    }

    const repair = getRepairById(repairId);

    if (!repair) {
      return res.status(404).json({
        success: false,
        error: `Repair with ID ${repairId} not found`,
      });
    }

    res.json({
      success: true,
      data: repair,
    });
  } catch (error) {
    console.error('[API] Fetch by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repair',
    });
  }
});

/**
 * GET /api/repairs/count/total
 * Get total count of repairs in database
 */
router.get('/count/total', (req, res) => {
  try {
    const count = getRepairCount();

    res.json({
      success: true,
      data: {
        total: count,
      },
    });
  } catch (error) {
    console.error('[API] Count error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get repair count',
    });
  }
});

/**
 * DELETE /api/repairs/clear
 * Clear all repairs (for testing only)
 */
router.delete('/clear', (req, res) => {
  try {
    const deleted = clearAllRepairs();

    res.json({
      success: true,
      message: `Deleted ${deleted} repairs from database`,
      data: {
        deleted: deleted,
      },
    });
  } catch (error) {
    console.error('[API] Clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear repairs',
    });
  }
});

module.exports = router;
