const { supabaseAdmin } = require('../config/supabase');
const { computeCheckoutBilling } = require('../services/billing.service');
const { logger } = require('../utils/logger');

// GET /api/bookings — List bookings with filters
async function getBookings(req, res) {
  try {
    const { status, room_id, customer_id, from_date, to_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

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
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (room_id) query = query.eq('room_id', room_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (from_date) query = query.gte('booking_date', from_date);
    if (to_date) query = query.lte('booking_date', to_date);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ bookings: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    logger.error('Failed to fetch bookings', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// GET /api/bookings/:id — Get single booking with full details
async function getBooking(req, res) {
  try {
    const { id } = req.params;

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
    if (!data) return res.status(404).json({ error: 'Booking not found' });

    res.json(data);
  } catch (err) {
    logger.error('Failed to fetch booking', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

// POST /api/bookings — Create a new booking
async function createBooking(req, res) {
  try {
    let { room_id, customer_id, no_of_persons, booking_date, rate_per_day, full_name, phone, aadhar_number, age, gender, address } = req.body;
    const { residency_id } = req.profile;

    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    // If customer details passed directly, find or create customer
    if (!customer_id && (phone || full_name)) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('residency_id', residency_id)
        .eq('phone', phone || '')
        .maybeSingle();

      if (existing) {
        customer_id = existing.id;
      } else {
        const { data: newCust, error: custErr } = await supabaseAdmin
          .from('customers')
          .insert({
            residency_id,
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
        customer_id = newCust.id;
      }
    }

    // Check if room exists and get details
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('*, room_categories(base_price)')
      .eq('id', room_id)
      .single();

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'available') {
      return res.status(409).json({ error: 'Room is not available for booking' });
    }

    const effectiveRate = rate_per_day || room.room_categories?.base_price || 1000;
    const effectiveDays = Number(req.body.no_of_days || 1);
    const effectiveAdvance = Number(req.body.advance_amount || 0);
    const effectiveTotal = Number(req.body.total_amount || (effectiveRate * effectiveDays));
    const effectiveDate = booking_date || new Date().toISOString().split('T')[0];
    const effectiveCheckIn = req.body.check_in || new Date().toISOString();
    const effectivePaymentMode = req.body.payment_mode || 'UPI';

    // Create booking and immediately check-in
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        room_id,
        customer_id,
        no_of_persons: no_of_persons || 1,
        no_of_days: effectiveDays,
        booking_date: effectiveDate,
        check_in: effectiveCheckIn,
        rate_per_day: effectiveRate,
        advance_amount: effectiveAdvance,
        total_amount: effectiveTotal,
        payment_mode: effectivePaymentMode,
        status: 'checked_in',
        created_by: req.profile?.id || '00000000-0000-0000-0000-000000000002'
      })
      .select(`
        *,
        customers (id, full_name, phone),
        rooms (id, room_number, room_categories (name))
      `)
      .single();

    if (error) throw error;

    // Update room status directly to occupied (red)
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', room_id);

    logger.success(`Booking created for room ${booking.rooms?.room_number || room.room_number}`);
    res.status(201).json(booking);
  } catch (err) {
    logger.error('Failed to create booking', err);
    res.status(500).json({ error: 'Failed to create booking', message: err.message });
  }
}

// PUT /api/bookings/:id/checkin — Record check-in time
async function recordCheckIn(req, res) {
  try {
    const { id } = req.params;
    const checkInTime = req.body.check_in || new Date().toISOString();

    // Fetch existing booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'checked_out') {
      return res.status(400).json({ error: 'Booking is already checked out' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is cancelled' });
    }

    // Update booking with check-in time
    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({
        check_in: checkInTime,
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

    logger.success(`Check-in recorded for booking ${id}`);
    res.json(updated);
  } catch (err) {
    logger.error('Failed to record check-in', err);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
}

// PUT /api/bookings/:id/checkout — Record check-out time + compute billing
async function recordCheckOut(req, res) {
  try {
    const { id } = req.params;
    const checkOutTime = req.body.check_out || new Date().toISOString();

    // Fetch existing booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'checked_out') {
      return res.status(400).json({ error: 'Booking is already checked out' });
    }
    if (!booking.check_in) {
      return res.status(400).json({ error: 'Cannot check out before checking in' });
    }

    // SERVER-SIDE BILLING — source of truth (24-hour slab rule)
    const { billableDays, totalAmount, durationHours } = computeCheckoutBilling(
      booking.check_in,
      checkOutTime,
      booking.rate_per_day
    );

    const { discount_percent, discount_amount, payment_mode } = req.body;

    // Update booking with checkout + billing + discount
    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({
        check_out: checkOutTime,
        billable_days: billableDays,
        total_amount: req.body.net_total !== undefined ? req.body.net_total : totalAmount,
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

    // Room flips back to available (green) — Supabase Realtime broadcasts this change
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);

    logger.success(`Checkout completed — Room ${updated.rooms.room_number}: ${billableDays} day(s), ₹${totalAmount} (${durationHours}h stay)`);

    res.json({
      ...updated,
      billing: { billableDays, totalAmount, durationHours }
    });
  } catch (err) {
    logger.error('Failed to record checkout', err);
    res.status(500).json({ error: 'Failed to record checkout', message: err.message });
  }
}

// PUT /api/bookings/:id/cancel — Cancel a booking
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'checked_out') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
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

    logger.success(`Booking ${id} cancelled`);
    res.json(updated);
  } catch (err) {
    logger.error('Failed to cancel booking', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

// GET /api/bookings/stats/today — Quick stats for dashboard
async function getTodayStats(req, res) {
  try {
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

    res.json({
      today_check_ins: todayCheckIns?.length || 0,
      today_check_outs: todayCheckOuts?.length || 0,
      today_revenue: todayRevenue
    });
  } catch (err) {
    logger.error('Failed to fetch today stats', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  getBookings, getBooking, createBooking,
  recordCheckIn, recordCheckOut, cancelBooking,
  getTodayStats
};
