const { supabaseAdmin } = require('../config/supabase');
const { computeCheckoutBilling } = require('./billing.service');
const { logger } = require('../utils/logger');
const {
  getCache,
  setCache,
  invalidateBookingsCache,
  invalidateCustomerSearchCache,
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
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        customers (id, full_name, phone),
        rooms (id, room_number, floor_id,
          room_categories (name),
          floors (floor_name, floor_number)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq('status', status);
    if (room_id) query = query.eq('room_id', room_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (from_date) query = query.gte('booking_date', from_date);
    if (to_date) query = query.lte('booking_date', to_date);

    const { data, error, count } = await query;
    if (error) throw error;

    return { bookings: data, total: count, page: pageNum, limit: limitNum };
  }

  /**
   * Get single booking by ID with customer, room, and floor relations
   */
  async getBooking(id) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        customers (*),
        rooms (*, room_categories (*), floors (*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Booking not found');

    return data;
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

    // If customer details passed directly, find or create customer
    if (!resolvedCustomerId && (phone || full_name)) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('residency_id', residencyId)
        .eq('phone', phone || '')
        .maybeSingle();

      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const { data: newCust, error: custErr } = await supabaseAdmin
          .from('customers')
          .insert({
            residency_id: residencyId,
            full_name: full_name || 'Guest',
            phone: phone || '',
            aadhar_number: aadhar_number || '',
            age: age || null,
            gender: gender || 'Male',
            address: address || ''
          })
          .select('id')
          .single();

        if (custErr) throw custErr;
        resolvedCustomerId = newCust.id;
      }
    }

    // Check if room exists and get details
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('*, room_categories(base_price)')
      .eq('id', room_id)
      .single();

    if (!room) throw new NotFoundError('Room not found');
    if (room.status !== 'available') {
      throw new ConflictError('Room is not available for booking');
    }

    const effectiveRate = rate_per_day || room.room_categories?.base_price || 1000;
    const effectiveDays = Number(no_of_days || 1);
    const effectiveAdvance = Number(advance_amount || 0);
    const effectiveTotal = Number(total_amount || (effectiveRate * effectiveDays));
    const effectiveDate = booking_date || new Date().toISOString().split('T')[0];
    const effectiveCheckIn = check_in || new Date().toISOString();
    const effectivePaymentMode = payment_mode || 'UPI';

    // Safely check if userId exists in profiles to satisfy foreign key constraint
    let validUserId = null;
    if (userId) {
      const { data: userProf } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (userProf) validUserId = userProf.id;
    }

    // Create booking and immediately check-in
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        room_id,
        customer_id: resolvedCustomerId,
        no_of_persons: no_of_persons || 1,
        no_of_days: effectiveDays,
        booking_date: effectiveDate,
        check_in: effectiveCheckIn,
        rate_per_day: effectiveRate,
        advance_amount: effectiveAdvance,
        total_amount: effectiveTotal,
        payment_mode: effectivePaymentMode,
        status: 'checked_in',
        created_by: validUserId
      })
      .select(`
        *,
        customers (id, full_name, phone),
        rooms (id, room_number, room_categories (name))
      `)
      .single();

    if (error) throw error;

    // Update room status to occupied (red)
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', room_id);

    logger.success(`Booking created for room ${booking.rooms?.room_number || room.room_number}`);
    await invalidateBookingsCache(residencyId);

    if (!customer_id && (phone || full_name)) {
      await invalidateCustomerSearchCache(residencyId);
    }

    return booking;
  }

  /**
   * Record check-in timestamp
   */
  async recordCheckIn({ id, checkInTime, residencyId }) {
    const resolvedCheckIn = checkInTime || new Date().toISOString();

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Booking is already checked out');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestError('Booking is cancelled');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({
        check_in: resolvedCheckIn,
        status: 'checked_in'
      })
      .eq('id', id)
      .select(`
        *,
        customers (id, full_name, phone),
        rooms (id, room_number, room_categories (name))
      `)
      .single();

    if (error) throw error;

    // Update room status to occupied (red)
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', booking.room_id);

    await invalidateBookingsCache(residencyId);
    logger.success(`Check-in recorded for booking ${id}`);

    return updated;
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
    residencyId
  }) {
    const resolvedCheckOut = checkOutTime || new Date().toISOString();

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Booking is already checked out');
    }
    if (!booking.check_in) {
      throw new BadRequestError('Cannot check out before checking in');
    }

    // SERVER-SIDE BILLING — source of truth (24-hour slab rule)
    const { billableDays, totalAmount, durationHours } = computeCheckoutBilling(
      booking.check_in,
      resolvedCheckOut,
      booking.rate_per_day
    );

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({
        check_out: resolvedCheckOut,
        billable_days: billableDays,
        total_amount: net_total !== undefined ? net_total : totalAmount,
        discount_percent: discount_percent || 0,
        discount_amount: discount_amount || 0,
        payment_mode: payment_mode || 'UPI',
        status: 'checked_out'
      })
      .eq('id', id)
      .select(`
        *,
        customers (id, full_name, phone),
        rooms (id, room_number, room_categories (name))
      `)
      .single();

    if (error) throw error;

    // Room flips back to available (green)
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);

    await invalidateBookingsCache(residencyId);

    logger.success(`Checkout completed — Room ${updated.rooms.room_number}: ${billableDays} day(s), ₹${totalAmount} (${durationHours}h stay)`);

    return {
      ...updated,
      billing: { billableDays, totalAmount, durationHours }
    };
  }

  /**
   * Cancel an active or reserved booking
   */
  async cancelBooking({ id, residencyId }) {
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status === 'checked_out') {
      throw new BadRequestError('Cannot cancel a completed booking');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Release room back to available
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);

    await invalidateBookingsCache(residencyId);
    logger.success(`Booking ${id} cancelled`);

    return updated;
  }

  /**
   * Get today's statistics for dashboard
   */
  async getTodayStats(residencyId) {
    const cacheKey = `residency:${residencyId}:dashboard:today_stats`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todayCheckIns } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact' })
      .gte('check_in', startOfDay.toISOString())
      .lte('check_in', endOfDay.toISOString());

    const { data: todayCheckOuts } = await supabaseAdmin
      .from('bookings')
      .select('id, total_amount', { count: 'exact' })
      .gte('check_out', startOfDay.toISOString())
      .lte('check_out', endOfDay.toISOString())
      .eq('status', 'checked_out');

    const todayRevenue = todayCheckOuts?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;

    const result = {
      today_check_ins: todayCheckIns?.length || 0,
      today_check_outs: todayCheckOuts?.length || 0,
      today_revenue: todayRevenue
    };

    // 2. Populate Redis cache
    await setCache(cacheKey, result, TTL.DASHBOARD_STATS);

    return result;
  }
}

module.exports = new BookingService();
