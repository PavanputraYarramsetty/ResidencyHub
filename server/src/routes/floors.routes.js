const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roleCheck.middleware');
const { getFloors, createFloor, updateFloor, deleteFloor } = require('../controllers/floorController');

router.use(authenticate);

router.get('/', getFloors);
router.post('/', requireRole('admin'), createFloor);
router.put('/:id', requireRole('admin'), updateFloor);
router.delete('/:id', requireRole('admin'), deleteFloor);

module.exports = router;
