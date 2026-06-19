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
 * Extract region from Notes field (e.g., "Item #1 - Region: EMEA" -> "EMEA")
 */
function extractRegionFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/Region:\s*([A-Z]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Filter repairs by region for non-global users
 */
function filterRepairsByRegion(repairs, userRole, userRegions) {
  if (userRole === 'global') {
    return repairs; // Global users see all
  }

  const allowedRegions = userRegions || [];
  return repairs.filter((repair) => {
    const region = extractRegionFromNotes(repair.notes || '');
    return region && allowedRegions.includes(region);
  });
}

/**
 * POST /api/repairs/save
 * Save parsed repair data to database
 * Body: { data: array of repair objects }
 * Region is extracted from Notes field (e.g., "Region: EMEA")
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

    // For region users, only allow saving to their region
    if (req.user.role === 'region') {
      const allowedRegion = req.user.regions[0];

      // Verify all items belong to user's region
      for (const item of data) {
        const region = extractRegionFromNotes(item.Notes || '');
        if (region && region !== allowedRegion) {
          return res.status(403).json({
            success: false,
            error: `Access denied. You can only save repairs for region: ${allowedRegion}`,
          });
        }
      }
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
 * Global users see all repairs; region users see only their region's repairs
 */
router.get('/', async (req, res) => {
  try {
    const repairs = await getAllRepairs();

    // Apply region filtering based on user role
    const filteredRepairs = filterRepairsByRegion(
      repairs,
      req.user.role,
      req.user.regions
    );
    const count = filteredRepairs.length;

    res.json({
      success: true,
      data: filteredRepairs,
      count: count,
      message: `Retrieved ${count} repairs from database (role: ${req.user.role})`,
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
 * For region users, returns count of repairs in their region only
 */
router.get('/count/total', async (req, res) => {
  try {
    let count;

    if (req.user.role === 'global') {
      count = await getRepairCount();
    } else {
      // For region users, filter by their regions
      const repairs = await getAllRepairs();
      const filtered = filterRepairsByRegion(
        repairs,
        req.user.role,
        req.user.regions
      );
      count = filtered.length;
    }

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
 * Region users can only access repairs from their region
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

    // Check region access for non-global users
    if (req.user.role === 'region') {
      const repairRegion = extractRegionFromNotes(repair.notes || '');
      if (!repairRegion || !req.user.regions.includes(repairRegion)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. You only have access to regions: ${req.user.regions.join(', ')}`,
        });
      }
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
