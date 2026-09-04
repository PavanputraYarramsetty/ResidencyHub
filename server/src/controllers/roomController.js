const roomService = require('../services/room.service');
const { logger } = require('../utils/logger');

// GET /api/rooms — List all rooms (optionally filter by floor_id)
async function getRooms(req, res, next) {
  try {
    const { floor_id } = req.query;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const rooms = await roomService.getRooms({ residencyId: residency_id, floorId: floor_id });
    res.json(rooms);
  } catch (err) {
    logger.error('Failed to fetch rooms', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

// GET /api/rooms/:id — Get single room with active booking
async function getRoom(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const room = await roomService.getRoom({ residencyId: residency_id, id });
    res.json(room);
  } catch (err) {
    logger.error('Failed to fetch room', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to fetch room' });
  }
}

// POST /api/rooms — Create a new room (admin only)
async function createRoom(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { floor_id, room_number, category_id, category_name, base_price, category } = req.body;

    const roomData = await roomService.createRoom({
      residencyId: residency_id,
      floor_id,
      room_number,
      category_id,
      category_name,
      base_price,
      category
    });

    res.status(201).json(roomData);
  } catch (err) {
    logger.error('Failed to create room', err);
    res.status(err.statusCode || 500).json({
      error: 'Failed to create room',
      message: err.message
    });
  }
}

// PUT /api/rooms/:id — Update a room (admin only)
async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { room_number, category_id, floor_id, status, category_name, base_price } = req.body;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const data = await roomService.updateRoom({
      residencyId: residency_id,
      id,
      room_number,
      category_id,
      floor_id,
      status,
      category_name,
      base_price
    });

    res.json(data);
  } catch (err) {
    logger.error('Failed to update room', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Room not found', message: 'Room not found' });
    }
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update room', message: err.message });
  }
}

// DELETE /api/rooms/:id — Delete a room (admin only)
async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await roomService.deleteRoom({ residencyId: residency_id, id });
    res.json(result);
  } catch (err) {
    logger.error('Failed to delete room', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete room', message: err.message });
  }
}

// GET /api/rooms/categories — List room categories
async function getCategories(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const categories = await roomService.getCategories(residency_id);
    res.json(categories);
  } catch (err) {
    logger.error('Failed to fetch categories', err);
    res.status(500).json({ error: 'Failed to fetch room categories' });
  }
}

// POST /api/rooms/categories — Create room category (admin only)
async function createCategory(req, res, next) {
  try {
    const { name, base_price, max_occupancy } = req.body;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const data = await roomService.createCategory({
      residencyId: residency_id,
      name,
      base_price,
      max_occupancy
    });

    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create category', err);
    res.status(err.statusCode || 500).json({ error: 'Failed to create room category' });
  }
}

// PUT /api/rooms/categories/:id — Update room category (admin only)
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, base_price, max_occupancy } = req.body;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const data = await roomService.updateCategory({
      residencyId: residency_id,
      id,
      name,
      base_price,
      max_occupancy
    });

    res.json(data);
  } catch (err) {
    logger.error('Failed to update category', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to update room category' });
  }
}

// DELETE /api/rooms/categories/:id — Delete room category (admin only)
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await roomService.deleteCategory({ residencyId: residency_id, id });
    res.json(result);
  } catch (err) {
    logger.error('Failed to delete category', err);
    res.status(err.statusCode || 500).json({ error: 'Failed to delete room category' });
  }
}

module.exports = {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  getCategories, createCategory, updateCategory, deleteCategory
};
