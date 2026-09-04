const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roleCheck.middleware');
const {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  getCategories, createCategory, updateCategory, deleteCategory
} = require('../controllers/roomController');

router.use(authenticate);

// Room categories
router.get('/categories', getCategories);
router.post('/categories', requireRole('admin', 'owner'), createCategory);
router.put('/categories/:id', requireRole('admin', 'owner'), updateCategory);
router.delete('/categories/:id', requireRole('admin', 'owner'), deleteCategory);

// Rooms
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', requireRole('admin', 'owner'), createRoom);
router.put('/:id', requireRole('admin', 'owner'), updateRoom);
router.delete('/:id', requireRole('admin', 'owner'), deleteRoom);

module.exports = router;
