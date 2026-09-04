const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
