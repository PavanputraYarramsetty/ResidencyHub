const { bookings, rooms, customers, categories, floors, generateUuid } = require('./datastore');
const { computeCheckoutBilling } = require('./billing.service');
const { logger } = require('../utils/logger');
const {
  getCache,
  setCache,
  invalidateBookingsCache,
  invalidateCustomerSearchCache,
  invalidateFloorsCache,
  TTL
} = require('./cache.service');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

class BookingService {
  /**
   * List bookings with filtering and pagination
   */
  async getBookings({ status, room_id, customer_id, from_date, to_date, page = 1, limit = 50 }) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;

    let filtered = [...bookings];
    if (status) filtered = filtered.filter((b) => b.status === status);
    if (room_id) filtered = filtered.filter((b) => b.room_id === room_id);
    if (customer_id) filtered = filtered.filter((b) => b.customer_id === customer_id);
    if (from_date) filtered = filtered.filter((b) => (b.booking_date || b.check_in) >= from_date);
    if (to_date) filtered = filtered.filter((b) => (b.booking_date || b.check_in) <= to_date);

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = filtered.length;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    const enriched = paginated.map((b) => {
      const cust = customers.find((c) => c.id === b.customer_id) || b.customers || { full_name: 'Guest', phone: '—' };
      const rm = rooms.find((r) => r.id === b.room_id) || { room_number: '—' };
      const cat = categories.find((c) => c.id === rm.category_id) || { name: 'Standard' };
      const flr = floors.find((f) => f.id === rm.floor_id) || { floor_name: 'Ground Floor', floor_number: 0 };

      return {
        ...b,
        customers: cust,
        rooms: {
          ...rm,
          room_categories: cat,
          floors: flr,
        },
      };
    });

    return { bookings: enriched, total, page: pageNum, limit: limitNum };
  }

  /**
   * Get single booking by ID with customer, room, and floor relations
   */
  async getBooking(id) {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new NotFoundError('Booking not found');

    const cust = customers.find((c) => c.id === booking.customer_id) || booking.customers || null;
    const rm = rooms.find((r) => r.id === booking.room_id) || { room_number: '—' };
    const cat = categories.find((c) => c.id === rm.category_id) || null;
    const flr = floors.find((f) => f.id === rm.floor_id) || null;

    return {
      ...booking,
      customers: cust,
      rooms: {
        ...rm,
        room_categories: cat,
        floors: flr,
      },
    };
  }

  /**
   * Create a new booking and check in guest
   */
  async createBooking({
    residencyId,
    userId,
    room_id,
    customer_id,
    no_of_persons,
    booking_date,
    rate_per_day,
    full_name,
    phone,
    aadhar_number,
    age,
    gender,
    address,
    no_of_days = 1,
    advance_amount = 0,
    total_amount,
    check_in,
    payment_mode = 'UPI'
  }) {
    if (!room_id) {
      throw new BadRequestError('room_id is required');
    }

    let resolvedCustomerId = customer_id;
    let targetCust = null;

    if (resolvedCustomerId) {
      targetCust = customers.find((c) => c.id === resolvedCustomerId);
    }
    if (!targetCust && phone) {
      targetCust = customers.find((c) => c.phone === phone);
    }

    if (targetCust) {
      if (full_name) targetCust.full_name = full_name;
      if (phone) targetCust.phone = phone;
      if (age) targetCust.age = age;
      if (gender) targetCust.gender = gender;
      if (address) targetCust.address = address;
      if (aadhar_number) targetCust.aadhar_number = aadhar_number;
      resolvedCustomerId = targetCust.id;
    } else {
      targetCust = {
        id: resolvedCustomerId || generateUuid(),
        residency_id: residencyId,
        full_name: full_name || 'Guest',
        phone: phone || '',
        aadhar_number: aadhar_number || '',
        age: age || null,
        gender: gender || 'Male',
        address: address || '',
        created_at: new Date().toISOString(),
      };
      customers.push(targetCust);
      resolvedCustomerId = targetCust.id;
    }

    const room = rooms.find((r) => r.id === room_id || r.room_number === String(room_id).replace(/^r-/, ''));
    if (!room) throw new NotFoundError('Room not found');
    if (room.status !== 'available') {
      throw new ConflictError('Room is not available for booking');
    }

    const cat = categories.find((c) => c.id === room.category_id) || { base_price: 1000, name: 'Standard' };
    const effectiveRate = Number(rate_per_day || cat.base_price || 1000);
    const effectiveDays = Number(no_of_days || 1);
    const effectiveAdvance = Number(advance_amount || 0);
    const effectiveTotal = Number(total_amount || (effectiveRate * effectiveDays));
    const effectiveDate = booking_date || new Date().toISOString().split('T')[0];
    const effectiveCheckIn = check_in || new Date().toISOString();
    const effectivePaymentMode = payment_mode || 'UPI';

    const newBooking = {
      id: generateUuid(),
      residency_id: residencyId,
      room_id: room.id,
      customer_id: resolvedCustomerId,
      full_name: targetCust.full_name || full_name || 'Guest',
      phone: targetCust.phone || phone || '—',
      no_of_persons: no_of_persons || 1,
      no_of_days: effectiveDays,
      booking_date: effectiveDate,
      check_in: effectiveCheckIn,
      rate_per_day: effectiveRate,
      advance_amount: effectiveAdvance,
      total_amount: effectiveTotal,
      payment_mode: effectivePaymentMode,
      status: 'checked_in',
      created_by: userId || null,
      created_at: new Date().toISOString(),
      customers: targetCust,
    };

    const cust = customers.find((c) => c.id === resolvedCustomerId) || {
      id: resolvedCustomerId,
      full_name: newBooking.full_name,
      phone: newBooking.phone,
      address: address || '',
    };
    newBooking.customers = cust;

    bookings.push(newBooking);

    // Update room status to occupied
    room.status = 'occupied';

    logger.success(`Booking created for room ${room.room_number} for customer ${newBooking.full_name}`);
    await invalidateBookingsCache(residencyId);
    await invalidateFloorsCache(residencyId);
    await invalidateCustomerSearchCache(residencyId);

    return {
      ...newBooking,
      customers: cust,
      rooms: {
        ...room,
        room_categories: cat,
      },
    };
  }

  /**
   * Record check-in timestamp
   */
  async recordCheckIn({ id, checkInTime, residencyId }) {
    const resolvedCheckIn = checkInTime || new Date().toISOString();

    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Booking is already checked out');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestError('Booking is cancelled');
    }

    booking.check_in = resolvedCheckIn;
    booking.status = 'checked_in';

    const room = rooms.find((r) => r.id === booking.room_id);
    if (room) room.status = 'occupied';

    const cust = customers.find((c) => c.id === booking.customer_id) || null;
    const cat = room ? categories.find((c) => c.id === room.category_id) : null;

    await invalidateBookingsCache(residencyId);
    await invalidateFloorsCache(residencyId);
    logger.success(`Check-in recorded for booking ${id}`);

    return {
      ...booking,
      customers: cust,
      rooms: room ? { ...room, room_categories: cat } : null,
    };
  }

  /**
   * Record checkout, compute server-side 24-hour slab billing, and update room
   */
  async recordCheckOut({
    id,
    checkOutTime,
    discount_percent,
    discount_amount,
    payment_mode,
    net_total,
    billableDays,
    billable_days,
    residencyId
  }) {
    const resolvedCheckOut = checkOutTime || new Date().toISOString();

    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Booking is already checked out');
    }
    if (!booking.check_in) {
      throw new BadRequestError('Cannot check out before checking in');
    }

    const { billableDays: computedDays, totalAmount, durationHours } = computeCheckoutBilling(
      booking.check_in,
      resolvedCheckOut,
      booking.rate_per_day
    );

    const finalBillableDays = (billable_days !== undefined || billableDays !== undefined)
      ? Number(billable_days || billableDays)
      : computedDays;

    booking.check_out = resolvedCheckOut;
    booking.billable_days = finalBillableDays;
    booking.total_amount = net_total !== undefined ? net_total : calculateTotalAmount(booking.rate_per_day, finalBillableDays);
    booking.discount_percent = discount_percent || 0;
    booking.discount_amount = discount_amount || 0;
    booking.payment_mode = payment_mode || 'UPI';
    booking.status = 'checked_out';

    const room = rooms.find((r) => r.id === booking.room_id);
    if (room) room.status = 'available';

    const cust = customers.find((c) => c.id === booking.customer_id) || null;
    const cat = room ? categories.find((c) => c.id === room.category_id) : null;

    await invalidateBookingsCache(residencyId);
    await invalidateFloorsCache(residencyId);

    logger.success(`Checkout completed — Room ${room?.room_number}: ${billableDays} day(s), ₹${totalAmount} (${durationHours}h stay)`);

    return {
      ...booking,
      customers: cust,
      rooms: room ? { ...room, room_categories: cat } : null,
      billing: { billableDays, totalAmount, durationHours },
    };
  }

  /**
   * Cancel an active or reserved booking
   */
  async cancelBooking({ id, residencyId }) {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Cannot cancel a completed booking');
    }

    booking.status = 'cancelled';

    const room = rooms.find((r) => r.id === booking.room_id);
    if (room) room.status = 'available';

    await invalidateBookingsCache(residencyId);
    await invalidateFloorsCache(residencyId);
    logger.success(`Booking ${id} cancelled`);

    return booking;
  }

  /**
   * Get today's statistics for dashboard
   */
  async getTodayStats(residencyId) {
    const cacheKey = `residency:${residencyId}:dashboard:today_stats`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCheckIns = bookings.filter((b) => {
      if (!b.check_in) return false;
      const t = new Date(b.check_in).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    const todayCheckOuts = bookings.filter((b) => {
      if (!b.check_out || b.status !== 'checked_out') return false;
      const t = new Date(b.check_out).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    const todayRevenue = todayCheckOuts.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

    const result = {
      today_check_ins: todayCheckIns.length,
      today_check_outs: todayCheckOuts.length,
      today_revenue: todayRevenue,
    };

    await setCache(cacheKey, result, TTL.DASHBOARD_STATS);
    return result;
  }
}

module.exports = new BookingService();
