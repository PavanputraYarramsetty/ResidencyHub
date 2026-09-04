const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roleCheck.middleware');
const {
  getBookings, getBooking, createBooking,
  recordCheckIn, recordCheckOut, cancelBooking,
  getTodayStats
} = require('../controllers/bookingController');

router.use(authenticate);

router.get('/stats/today', getTodayStats);
router.get('/today-stats', getTodayStats);
router.get('/', getBookings);
router.get('/:id', getBooking);
router.post('/', requireRole('owner', 'staff', 'admin'), createBooking);
router.put('/:id/checkin', requireRole('owner', 'staff', 'admin'), recordCheckIn);
router.post('/:id/checkin', requireRole('owner', 'staff', 'admin'), recordCheckIn);
router.put('/:id/checkout', requireRole('owner', 'staff', 'admin'), recordCheckOut);
router.post('/:id/checkout', requireRole('owner', 'staff', 'admin'), recordCheckOut);
router.put('/:id/cancel', requireRole('owner', 'staff', 'admin'), cancelBooking);
router.post('/:id/cancel', requireRole('owner', 'staff', 'admin'), cancelBooking);

module.exports = router;
