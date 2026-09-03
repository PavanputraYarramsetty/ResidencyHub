const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');

// GET /api/rooms — List all rooms (optionally filter by floor_id)
async function getRooms(req, res) {
  try {
    const { floor_id } = req.query;

    let query = supabaseAdmin
      .from('rooms')
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors!inner (id, floor_number, floor_name, residency_id)
      `)
      .eq('floors.residency_id', req.profile.residency_id)
      .order('room_number', { ascending: true });

    if (floor_id) {
      query = query.eq('floor_id', floor_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    logger.error('Failed to fetch rooms', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

// GET /api/rooms/:id — Get single room with active booking
async function getRoom(req, res) {
  try {
    const { id } = req.params;

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors (id, floor_number, floor_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Fetch active booking if room is occupied
    let activeBooking = null;
    if (room.status === 'occupied' || room.status === 'reserved') {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          customers (*)
        `)
        .eq('room_id', id)
        .in('status', ['booked', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      activeBooking = booking;
    }

    res.json({ ...room, active_booking: activeBooking });
  } catch (err) {
    logger.error('Failed to fetch room', err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
}

// POST /api/rooms — Create a new room (admin only)
async function createRoom(req, res) {
  try {
    const { floor_id, room_number, category_id } = req.body;

    if (!floor_id || !room_number || !category_id) {
      return res.status(400).json({ error: 'floor_id, room_number, and category_id are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert({ floor_id, room_number, category_id, status: 'available' })
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors (id, floor_number, floor_name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: `Room ${room_number} already exists on this floor` });
      }
      throw error;
    }

    logger.success(`Room created: ${room_number}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create room', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

// PUT /api/rooms/:id — Update a room (admin only)
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { room_number, category_id, floor_id } = req.body;

    const updateData = {};
    if (room_number) updateData.room_number = room_number;
    if (category_id) updateData.category_id = category_id;
    if (floor_id) updateData.floor_id = floor_id;

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Failed to update room', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
}

// DELETE /api/rooms/:id — Delete a room (admin only)
async function deleteRoom(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete room', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
}

// GET /api/rooms/categories — List room categories
async function getCategories(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .select('*')
      .eq('residency_id', req.profile.residency_id)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Failed to fetch categories', err);
    res.status(500).json({ error: 'Failed to fetch room categories' });
  }
}

// POST /api/rooms/categories — Create room category (admin only)
async function createCategory(req, res) {
  try {
    const { name, base_price, max_occupancy } = req.body;

    if (!name || !base_price) {
      return res.status(400).json({ error: 'name and base_price are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .insert({
        residency_id: req.profile.residency_id,
        name,
        base_price,
        max_occupancy: max_occupancy || 2
      })
      .select()
      .single();

    if (error) throw error;
    logger.success(`Category created: ${name}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create category', err);
    res.status(500).json({ error: 'Failed to create room category' });
  }
}

// PUT /api/rooms/categories/:id — Update room category (admin only)
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, base_price, max_occupancy } = req.body;

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .update({ name, base_price, max_occupancy })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Failed to update category', err);
    res.status(500).json({ error: 'Failed to update room category' });
  }
}

// DELETE /api/rooms/categories/:id — Delete room category (admin only)
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('room_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete category', err);
    res.status(500).json({ error: 'Failed to delete room category' });
  }
}

module.exports = {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  getCategories, createCategory, updateCategory, deleteCategory
};
