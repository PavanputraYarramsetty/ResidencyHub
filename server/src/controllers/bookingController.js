const bookingService = require('../services/booking.service');
const { logger } = require('../utils/logger');

// GET /api/bookings — List bookings with filters
async function getBookings(req, res, next) {
  try {
    const { status, room_id, customer_id, from_date, to_date, page = 1, limit = 50 } = req.query;

    const result = await bookingService.getBookings({
      status,
      room_id,
      customer_id,
      from_date,
      to_date,
      page,
      limit
    });

    res.json(result);
  } catch (err) {
    logger.error('Failed to fetch bookings', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// GET /api/bookings/:id — Get single booking with full details
async function getBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBooking(id);
    res.json(booking);
  } catch (err) {
    logger.error('Failed to fetch booking', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to fetch booking' });
  }
}

// POST /api/bookings — Create a new booking
async function createBooking(req, res, next) {
  try {
    const {
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
      no_of_days,
      advance_amount,
      total_amount,
      check_in,
      payment_mode
    } = req.body;

    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const userId = req.profile?.id;

    const booking = await bookingService.createBooking({
      residencyId: residency_id,
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
      no_of_days,
      advance_amount,
      total_amount,
      check_in,
      payment_mode
    });

    res.status(201).json(booking);
  } catch (err) {
    logger.error('Failed to create booking', err);
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({ error: 'Room is not available for booking' });
    }
    res.status(500).json({ error: 'Failed to create booking', message: err.message });
  }
}

// PUT /api/bookings/:id/checkin — Record check-in time
async function recordCheckIn(req, res, next) {
  try {
    const { id } = req.params;
    const checkInTime = req.body.check_in;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const updated = await bookingService.recordCheckIn({
      id,
      checkInTime,
      residencyId: residency_id
    });

    res.json(updated);
  } catch (err) {
    logger.error('Failed to record check-in', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to record check-in' });
  }
}

// PUT /api/bookings/:id/checkout — Record check-out time + compute billing
async function recordCheckOut(req, res, next) {
  try {
    const { id } = req.params;
    const checkOutTime = req.body.check_out;
    const { discount_percent, discount_amount, payment_mode, net_total } = req.body;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await bookingService.recordCheckOut({
      id,
      checkOutTime,
      discount_percent,
      discount_amount,
      payment_mode,
      net_total,
      residencyId: residency_id
    });

    res.json(result);
  } catch (err) {
    logger.error('Failed to record checkout', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to record checkout', message: err.message });
  }
}

// PUT /api/bookings/:id/cancel — Cancel a booking
async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const updated = await bookingService.cancelBooking({ id, residencyId: residency_id });
    res.json(updated);
  } catch (err) {
    logger.error('Failed to cancel booking', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to cancel booking' });
  }
}

// GET /api/bookings/stats/today — Quick stats for dashboard
async function getTodayStats(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const result = await bookingService.getTodayStats(residency_id);
    res.json(result);
  } catch (err) {
    logger.error('Failed to fetch today stats', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  getBookings,
  getBooking,
  createBooking,
  recordCheckIn,
  recordCheckOut,
  cancelBooking,
  getTodayStats
};
