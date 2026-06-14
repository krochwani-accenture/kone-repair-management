const express = require('express');
const router = express.Router();
const {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
} = require('../utils/db_dynamo');

/**
 * POST /api/repairs/save
 * Save parsed repair data to database
 * Body: { data: array of repair objects }
 */
router.post('/save', async (req, res) => {
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

    const result = await saveRepairsToDatabase(data);

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
router.get('/', async (req, res) => {
  try {
    const repairs = await getAllRepairs();
    const count = await getRepairCount();

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
 * GET /api/repairs/count/total
 * Get total count of repairs in database
 */
router.get('/count/total', async (req, res) => {
  try {
    const count = await getRepairCount();

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
router.delete('/clear', async (req, res) => {
  try {
    const deleted = await clearAllRepairs();

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

/**
 * GET /api/repairs/:repairId
 * Fetch specific repair by ID
 */
router.get('/:repairId', async (req, res) => {
  try {
    const { repairId } = req.params;

    if (!repairId) {
      return res.status(400).json({
        success: false,
        error: 'Repair ID is required',
      });
    }

    const repair = await getRepairById(repairId);

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

module.exports = router;
