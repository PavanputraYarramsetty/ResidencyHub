const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');

// GET /api/floors — List all floors for the user's residency
async function getFloors(req, res) {
  try {
    const { residency_id } = req.profile;

    const { data, error } = await supabaseAdmin
      .from('floors')
      .select(`
        *,
        rooms (id, room_number, status, category_id,
          room_categories (name, base_price)
        )
      `)
      .eq('residency_id', residency_id)
      .order('floor_number', { ascending: true });

    if (error) throw error;

    // Add occupancy stats to each floor
    const floorsWithStats = data.map(floor => {
      const totalRooms = floor.rooms?.length || 0;
      const occupiedRooms = floor.rooms?.filter(r => r.status === 'occupied').length || 0;
      const availableRooms = floor.rooms?.filter(r => r.status === 'available').length || 0;
      const reservedRooms = floor.rooms?.filter(r => r.status === 'reserved').length || 0;

      return {
        ...floor,
        stats: { totalRooms, occupiedRooms, availableRooms, reservedRooms }
      };
    });

    res.json(floorsWithStats);
  } catch (err) {
    logger.error('Failed to fetch floors', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
}

// POST /api/floors — Create a new floor (admin only)
async function createFloor(req, res) {
  try {
    const { residency_id } = req.profile;
    const { floor_number, floor_name } = req.body;

    if (floor_number === undefined || !floor_name) {
      return res.status(400).json({ error: 'floor_number and floor_name are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('floors')
      .insert({ residency_id, floor_number, floor_name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: `Floor ${floor_number} already exists` });
      }
      throw error;
    }

    logger.success(`Floor created: ${floor_name} (${floor_number})`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create floor', err);
    res.status(500).json({ error: 'Failed to create floor' });
  }
}

// PUT /api/floors/:id — Update a floor (admin only)
async function updateFloor(req, res) {
  try {
    const { id } = req.params;
    const { floor_number, floor_name } = req.body;

    const { data, error } = await supabaseAdmin
      .from('floors')
      .update({ floor_number, floor_name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Floor not found' });

    res.json(data);
  } catch (err) {
    logger.error('Failed to update floor', err);
    res.status(500).json({ error: 'Failed to update floor' });
  }
}

// DELETE /api/floors/:id — Delete a floor (admin only)
async function deleteFloor(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('floors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Floor deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete floor', err);
    res.status(500).json({ error: 'Failed to delete floor' });
  }
}

module.exports = { getFloors, createFloor, updateFloor, deleteFloor };
