const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getRevenueSummary, getDashboardStats } = require('../controllers/revenueController');

router.use(authenticate);

router.get('/', getRevenueSummary);
router.get('/summary', getRevenueSummary);
router.get('/dashboard', getDashboardStats);

module.exports = router;
