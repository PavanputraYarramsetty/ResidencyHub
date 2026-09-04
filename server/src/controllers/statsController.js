const { bookings, rooms, floors, categories, customers } = require('../services/datastore');

async function getBookingStatistics(req, res, next) {
  try {
    const { from_date, to_date, floor_id, room_id, category_id, status, search } = req.query;

    const categoriesMap = {};
    categories.forEach((c) => { categoriesMap[c.id] = c; });

    const floorsMap = {};
    floors.forEach((f) => { floorsMap[f.id] = f; });

    let filtered = [...bookings];

    if (status) filtered = filtered.filter((b) => b.status === status);
    if (room_id) filtered = filtered.filter((b) => b.room_id === room_id);
    if (from_date) filtered = filtered.filter((b) => (b.booking_date || b.check_in_at || b.check_in) >= from_date);
    if (to_date) filtered = filtered.filter((b) => (b.booking_date || b.check_in_at || b.check_in) <= to_date);

    const enriched = filtered.map((b) => {
      const cust = customers.find((c) => c.id === b.customer_id) || b.customers || { full_name: 'Guest', phone: '—' };
      const rm = rooms.find((r) => r.id === b.room_id) || { room_number: '—' };
      const cat = categoriesMap[rm.category_id] || { name: 'Standard' };
      const flr = floorsMap[rm.floor_id] || { floor_name: 'Ground Floor', floor_number: 0 };

      return {
        id: b.id,
        booking_date: b.booking_date,
        check_in: b.check_in_at || b.check_in,
        check_out: b.check_out_at || b.check_out,
        billing_units: b.billing_units || 1,
        rate_per_day: b.price_per_24_hours || b.rate_per_day,
        total_amount: b.total_amount,
        advance_amount: b.advance_amount || 0,
        payment_mode: b.payment_mode || 'UPI',
        status: b.status,
        number_of_persons: b.number_of_persons || b.no_of_persons || 1,
        customer_name: cust.full_name,
        customer_phone: cust.phone,
        room_number: rm.room_number,
        floor_name: flr.floor_name,
        floor_id: rm.floor_id,
        category_name: cat.name,
        category_id: rm.category_id,
        created_at: b.created_at,
      };
    });

    let finalResult = enriched;
    if (floor_id) finalResult = finalResult.filter((b) => b.floor_id === floor_id);
    if (category_id) finalResult = finalResult.filter((b) => b.category_id === category_id);
    if (search) {
      const q = search.toLowerCase();
      finalResult = finalResult.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(q) ||
          b.customer_phone?.includes(q) ||
          b.room_number?.toLowerCase().includes(q)
      );
    }

    finalResult.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json({
      total: finalResult.length,
      bookings: finalResult,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBookingStatistics,
};
