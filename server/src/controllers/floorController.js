const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');

// GET /api/floors — List all floors for the user's residency
async function getFloors(req, res) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('floors')
      .select(`
        *,
        rooms (
          id,
          floor_id,
          room_number,
          status,
          category_id,
          room_categories (id, name, base_price, max_occupancy)
        )
      `)
      .eq('residency_id', residency_id)
      .order('floor_number', { ascending: true });

    if (error) throw error;

    // Add occupancy stats to each floor
    const floorsWithStats = (data || []).map(floor => {
      const rooms = (floor.rooms || []).sort((a, b) => {
        const numA = parseInt(a.room_number, 10);
        const numB = parseInt(b.room_number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.room_number).localeCompare(String(b.room_number));
      });

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const availableRooms = rooms.filter(r => r.status === 'available').length;
      const reservedRooms = rooms.filter(r => r.status === 'reserved').length;

      return {
        ...floor,
        rooms,
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
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    let { floor_number, floor_name } = req.body;

    if (floor_number === undefined && !floor_name) {
      return res.status(400).json({ error: 'floor_number or floor_name is required' });
    }

    if (floor_number === undefined || floor_number === null || isNaN(Number(floor_number))) {
      const { data: existingFloors } = await supabaseAdmin
        .from('floors')
        .select('floor_number')
        .eq('residency_id', residency_id)
        .order('floor_number', { ascending: false })
        .limit(1);

      const maxFloor = existingFloors && existingFloors.length > 0 ? existingFloors[0].floor_number : -1;
      floor_number = maxFloor + 1;
    } else {
      floor_number = Number(floor_number);
    }

    if (!floor_name) {
      floor_name = floor_number === 0 ? 'Ground Floor' : `Floor ${floor_number}`;
    }

    // Check if floor with floor_number already exists
    const { data: existingFloor } = await supabaseAdmin
      .from('floors')
      .select('*, rooms(*, room_categories(*))')
      .eq('residency_id', residency_id)
      .eq('floor_number', floor_number)
      .maybeSingle();

    if (existingFloor) {
      const { data: updatedFloor, error: updErr } = await supabaseAdmin
        .from('floors')
        .update({ floor_name })
        .eq('id', existingFloor.id)
        .select('*, rooms(*, room_categories(*))')
        .single();

      if (updErr) throw updErr;
      return res.status(200).json(updatedFloor || existingFloor);
    }

    const { data, error } = await supabaseAdmin
      .from('floors')
      .insert({ residency_id, floor_number, floor_name })
      .select('*, rooms(*, room_categories(*))')
      .single();

    if (error) {
      throw error;
    }

    logger.success(`Floor created: ${floor_name} (${floor_number})`);
    res.status(201).json({ ...data, rooms: data.rooms || [] });
  } catch (err) {
    logger.error('Failed to create floor', err);
    res.status(500).json({ error: 'Failed to create floor', message: err.message });
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
      .select('*, rooms(*, room_categories(*))')
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

    // First get rooms on this floor to delete bookings
    const { data: roomsOnFloor } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('floor_id', id);

    if (roomsOnFloor && roomsOnFloor.length > 0) {
      const roomIds = roomsOnFloor.map(r => r.id);
      await supabaseAdmin.from('bookings').delete().in('room_id', roomIds);
      await supabaseAdmin.from('rooms').delete().eq('floor_id', id);
    }

    const { error } = await supabaseAdmin
      .from('floors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Floor deleted successfully', id });
  } catch (err) {
    logger.error('Failed to delete floor', err);
    res.status(500).json({ error: 'Failed to delete floor' });
  }
}

module.exports = { getFloors, createFloor, updateFloor, deleteFloor };
