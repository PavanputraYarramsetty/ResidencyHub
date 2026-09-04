const { bookings, rooms, floors, categories } = require('./datastore');
const { getCache, setCache, TTL } = require('./cache.service');

class RevenueService {
  /**
   * Compute aggregated revenue summary with date, floor, and category breakdowns
   */
  async getRevenueSummary({ residencyId, from_date, to_date, floor_id, category_id, period }) {
    const cacheKey = `residency:${residencyId}:revenue:${from_date || ''}:${to_date || ''}:${floor_id || ''}:${category_id || ''}:${period || ''}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const categoriesMap = {};
    categories.forEach((c) => { categoriesMap[c.id] = c; });

    const floorsMap = {};
    floors.forEach((f) => { floorsMap[f.id] = f; });

    let completedBookings = bookings.filter((b) => b.status === 'checked_out');

    if (from_date) {
      completedBookings = completedBookings.filter((b) => b.check_out && b.check_out.split('T')[0] >= from_date);
    }
    if (to_date) {
      completedBookings = completedBookings.filter((b) => b.check_out && b.check_out.split('T')[0] <= to_date);
    }

    const enriched = completedBookings
      .map((b) => {
        const rm = rooms.find((r) => r.id === b.room_id) || { room_number: '—' };
        const cat = categoriesMap[rm.category_id] || { id: rm.category_id, name: 'Standard' };
        const flr = floorsMap[rm.floor_id] || { id: rm.floor_id, floor_name: 'Ground Floor', floor_number: 0 };

        return {
          id: b.id,
          check_out: b.check_out,
          total_amount: b.total_amount,
          billable_days: b.billable_days,
          rate_per_day: b.rate_per_day,
          rooms: {
            ...rm,
            room_categories: cat,
            floors: flr,
          },
        };
      })
      .filter((b) => {
        if (floor_id && b.rooms?.floor_id !== floor_id) return false;
        if (category_id && b.rooms?.category_id !== category_id) return false;
        return true;
      });

    const totalRevenue = enriched.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalBookings = enriched.length;

    // Group by date
    const byDate = {};
    enriched.forEach((b) => {
      const date = b.check_out?.split('T')[0] || new Date().toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { date, revenue: 0, bookings: 0 };
      byDate[date].revenue += parseFloat(b.total_amount) || 0;
      byDate[date].bookings += 1;
    });

    // Group by floor
    const byFloor = {};
    enriched.forEach((b) => {
      const floorName = b.rooms?.floors?.floor_name || 'Unknown';
      if (!byFloor[floorName]) byFloor[floorName] = { floor: floorName, revenue: 0, bookings: 0 };
      byFloor[floorName].revenue += parseFloat(b.total_amount) || 0;
      byFloor[floorName].bookings += 1;
    });

    // Group by category
    const byCategory = {};
    enriched.forEach((b) => {
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
      bookings: enriched,
    };

    await setCache(cacheKey, result, TTL.REVENUE);
    return result;
  }
}

module.exports = new RevenueService();
