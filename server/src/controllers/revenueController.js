const revenueService = require('../services/revenue.service');
const { logger } = require('../utils/logger');

// GET /api/revenue — Revenue summary with filters
async function getRevenueSummary(req, res, next) {
  try {
    const { from_date, to_date, floor_id, category_id, period } = req.query;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await revenueService.getRevenueSummary({
      residencyId: residency_id,
      from_date,
      to_date,
      floor_id,
      category_id,
      period
    });

    res.json(result);
  } catch (err) {
    logger.error('Failed to fetch revenue', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
}

module.exports = { getRevenueSummary };
