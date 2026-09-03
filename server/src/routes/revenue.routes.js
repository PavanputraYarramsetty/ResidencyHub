const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getRevenueSummary } = require('../controllers/revenueController');

router.use(authenticate);

router.get('/', getRevenueSummary);

module.exports = router;
