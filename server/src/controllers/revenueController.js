const revenueService = require('../services/revenue.service');
const bookingService = require('../services/booking.service');
const floorService = require('../services/floor.service');
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

// GET /api/revenue/dashboard — Live operational & financial summary
async function getDashboardStats(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    
    const [todayStats, revenueSummary, floors] = await Promise.all([
      bookingService.getTodayStats(residency_id).catch(() => ({})),
      revenueService.getRevenueSummary({ residencyId: residency_id }).catch(() => ({ total_revenue: 0 })),
      floorService.getFloors(residency_id).catch(() => []),
    ]);

    const allRooms = (floors || []).flatMap(f => f.rooms || []);
    const totalRooms = allRooms.length;
    const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
    const availableRooms = allRooms.filter(r => r.status === 'available').length;

    res.json({
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      available_rooms: availableRooms,
      total_revenue: revenueSummary?.total_revenue || 0,
      today_check_ins: todayStats?.today_check_ins || 0,
      today_check_outs: todayStats?.today_check_outs || 0,
      today_revenue: todayStats?.today_revenue || 0,
    });
  } catch (err) {
    logger.error('Failed to fetch dashboard stats', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { getRevenueSummary, getDashboardStats };
