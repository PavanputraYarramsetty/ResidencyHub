const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roleCheck.middleware');
const {
  getCustomers, searchCustomers, getCustomer,
  createCustomer, updateCustomer, findOrCreateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.use(authenticate);

router.get('/search', searchCustomers);
router.post('/find-or-create', requireRole('owner', 'staff', 'admin'), findOrCreateCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', requireRole('owner', 'staff', 'admin'), createCustomer);
router.put('/:id', requireRole('owner', 'staff', 'admin'), updateCustomer);
router.delete('/:id', requireRole('owner', 'admin'), deleteCustomer);

module.exports = router;
