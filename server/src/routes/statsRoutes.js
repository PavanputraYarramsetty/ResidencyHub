const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/bookings', statsController.getBookingStatistics);
router.get('/', statsController.getBookingStatistics);

module.exports = router;
