const floorService = require('../services/floor.service');
const { logger } = require('../utils/logger');

// GET /api/floors — List all floors for the user's residency
async function getFloors(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const floors = await floorService.getFloors(residency_id);
    res.json(floors);
  } catch (err) {
    logger.error('Failed to fetch floors', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
}

// POST /api/floors — Create a new floor (admin only)
async function createFloor(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { floor_number, floor_name } = req.body;

    const result = await floorService.createFloor({
      residencyId: residency_id,
      floorNumber: floor_number,
      floorName: floor_name
    });

    res.status(result.isNew ? 201 : 200).json(result.floor);
  } catch (err) {
    logger.error('Failed to create floor', err);
    res.status(err.statusCode || 500).json({
      error: 'Failed to create floor',
      message: err.message
    });
  }
}

// PUT /api/floors/:id — Update a floor (admin only)
async function updateFloor(req, res, next) {
  try {
    const { id } = req.params;
    const { floor_number, floor_name } = req.body;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const updatedFloor = await floorService.updateFloor({
      id,
      residencyId: residency_id,
      floorNumber: floor_number,
      floorName: floor_name
    });

    res.json(updatedFloor);
  } catch (err) {
    logger.error('Failed to update floor', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Floor not found', message: 'Floor not found' });
    }
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update floor', message: err.message });
  }
}

// DELETE /api/floors/:id — Delete a floor (admin only)
async function deleteFloor(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await floorService.deleteFloor({ id, residencyId: residency_id });
    res.json(result);
  } catch (err) {
    logger.error('Failed to delete floor', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete floor', message: err.message });
  }
}

module.exports = { getFloors, createFloor, updateFloor, deleteFloor };
