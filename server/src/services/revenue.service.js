const { supabaseAdmin } = require('../config/supabase');
const { getCache, setCache, TTL } = require('./cache.service');

class RevenueService {
  /**
   * Compute aggregated revenue summary with date, floor, and category breakdowns
   */
  async getRevenueSummary({ residencyId, from_date, to_date, floor_id, category_id, period }) {
    const cacheKey = `residency:${residencyId}:revenue:${from_date || ''}:${to_date || ''}:${floor_id || ''}:${category_id || ''}:${period || ''}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Query completed bookings directly for flexible filtering
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id, check_out, total_amount, billable_days, rate_per_day,
        rooms!inner (
          id, room_number, floor_id, category_id,
          room_categories (id, name),
          floors!inner (id, floor_name, floor_number, residency_id)
        )
      `)
      .eq('status', 'checked_out')
      .eq('rooms.floors.residency_id', residencyId)
      .not('total_amount', 'is', null)
      .order('check_out', { ascending: false });

    if (from_date) query = query.gte('check_out', `${from_date}T00:00:00`);
    if (to_date) query = query.lte('check_out', `${to_date}T23:59:59`);
    if (floor_id) query = query.eq('rooms.floor_id', floor_id);
    if (category_id) query = query.eq('rooms.category_id', category_id);

    const { data, error } = await query;
    if (error) throw error;

    // Compute aggregations
    const totalRevenue = (data || []).reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalBookings = (data || []).length;

    // Group by date for charts
    const byDate = {};
    (data || []).forEach(b => {
      const date = b.check_out?.split('T')[0];
      if (!byDate[date]) byDate[date] = { date, revenue: 0, bookings: 0 };
      byDate[date].revenue += parseFloat(b.total_amount) || 0;
      byDate[date].bookings += 1;
    });

    // Group by floor
    const byFloor = {};
    (data || []).forEach(b => {
      const floorName = b.rooms?.floors?.floor_name || 'Unknown';
      if (!byFloor[floorName]) byFloor[floorName] = { floor: floorName, revenue: 0, bookings: 0 };
      byFloor[floorName].revenue += parseFloat(b.total_amount) || 0;
      byFloor[floorName].bookings += 1;
    });

    // Group by category
    const byCategory = {};
    (data || []).forEach(b => {
      const catName = b.rooms?.room_categories?.name || 'Unknown';
      if (!byCategory[catName]) byCategory[catName] = { category: catName, revenue: 0, bookings: 0 };
      byCategory[catName].revenue += parseFloat(b.total_amount) || 0;
      byCategory[catName].bookings += 1;
    });

    const result = {
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_bookings: totalBookings,
      by_date: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      by_floor: Object.values(byFloor),
      by_category: Object.values(byCategory),
      bookings: data || []
    };

    // 2. Populate Redis cache
    await setCache(cacheKey, result, TTL.REVENUE);

    return result;
  }
}

module.exports = new RevenueService();
