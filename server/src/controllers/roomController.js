const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateRoomsCache, invalidateCategoriesCache, TTL } = require('../services/cache.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/rooms — List all rooms (optionally filter by floor_id)
async function getRooms(req, res) {
  try {
    const { floor_id } = req.query;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const cacheKey = `residency:${residency_id}:rooms:${floor_id || 'all'}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query = supabaseAdmin
      .from('rooms')
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors!inner (id, floor_number, floor_name, residency_id)
      `)
      .eq('floors.residency_id', residency_id)
      .order('room_number', { ascending: true });

    if (floor_id) {
      query = query.eq('floor_id', floor_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 2. Populate Redis cache
    await setCache(cacheKey, data, TTL.ROOMS);

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
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const cacheKey = `residency:${residency_id}:room:${id}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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
        .maybeSingle();

      activeBooking = booking;
    }

    const result = { ...room, active_booking: activeBooking };

    // 2. Populate Redis cache
    await setCache(cacheKey, result, TTL.ROOMS);

    res.json(result);
  } catch (err) {
    logger.error('Failed to fetch room', err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
}

// POST /api/rooms — Create a new room (admin only)
async function createRoom(req, res) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    let { floor_id, room_number, category_id, category_name, base_price, category } = req.body;

    if (!room_number) {
      return res.status(400).json({ error: 'room_number is required' });
    }

    // 1. Resolve Target Floor UUID
    let resolvedFloorId = floor_id;
    if (!resolvedFloorId || !UUID_REGEX.test(resolvedFloorId)) {
      // Find floor by ID if exists or pick lowest floor
      const { data: allFloors } = await supabaseAdmin
        .from('floors')
        .select('id, floor_number')
        .eq('residency_id', residency_id)
        .order('floor_number', { ascending: true });

      if (allFloors && allFloors.length > 0) {
        resolvedFloorId = allFloors[0].id;
      } else {
        // Create default Ground Floor if none exists
        const { data: newFloor, error: fErr } = await supabaseAdmin
          .from('floors')
          .insert({ residency_id, floor_number: 0, floor_name: 'Ground Floor' })
          .select()
          .single();
        if (fErr) throw fErr;
        resolvedFloorId = newFloor.id;
      }
    }

    // 2. Resolve Category UUID
    let resolvedCatId = null;
    const catName = (category_name || category?.name || (typeof category_id === 'string' && !UUID_REGEX.test(category_id) ? category_id : 'Standard')).trim();
    const catPrice = Number(base_price || category?.base_price || 1500);

    if (category_id && UUID_REGEX.test(category_id)) {
      const { data: existingCat } = await supabaseAdmin
        .from('room_categories')
        .select('id')
        .eq('id', category_id)
        .maybeSingle();
      if (existingCat) {
        resolvedCatId = existingCat.id;
      }
    }

    if (!resolvedCatId) {
      // Look up by clean name
      const { data: matchedCat } = await supabaseAdmin
        .from('room_categories')
        .select('id, name')
        .eq('residency_id', residency_id)
        .ilike('name', catName)
        .maybeSingle();

      if (matchedCat) {
        resolvedCatId = matchedCat.id;
      } else {
        // Create new category in database
        const { data: newCat, error: catErr } = await supabaseAdmin
          .from('room_categories')
          .insert({
            residency_id,
            name: catName,
            base_price: catPrice,
            max_occupancy: 2
          })
          .select()
          .single();

        if (catErr) throw catErr;
        resolvedCatId = newCat.id;
      }
    }

    // 3. Check if room exists on this floor
    const { data: existingRoom } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('floor_id', resolvedFloorId)
      .eq('room_number', String(room_number))
      .maybeSingle();

    let roomData;
    if (existingRoom) {
      const { data: updRoom, error: updErr } = await supabaseAdmin
        .from('rooms')
        .update({ category_id: resolvedCatId })
        .eq('id', existingRoom.id)
        .select(`
          *,
          room_categories (id, name, base_price, max_occupancy),
          floors (id, floor_number, floor_name)
        `)
        .single();
      if (updErr) throw updErr;
      roomData = updRoom;
    } else {
      const { data: insRoom, error: insErr } = await supabaseAdmin
        .from('rooms')
        .insert({
          floor_id: resolvedFloorId,
          room_number: String(room_number),
          category_id: resolvedCatId,
          status: 'available'
        })
        .select(`
          *,
          room_categories (id, name, base_price, max_occupancy),
          floors (id, floor_number, floor_name)
        `)
        .single();

      if (insErr) throw insErr;
      roomData = insRoom;
    }

    // 4. Invalidate affected caches
    await invalidateRoomsCache(residency_id);

    logger.success(`Room created: ${room_number}`);
    res.status(201).json(roomData);
  } catch (err) {
    logger.error('Failed to create room', err);
    res.status(500).json({ error: 'Failed to create room', message: err.message });
  }
}

// PUT /api/rooms/:id — Update a room (admin only)
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { room_number, category_id, floor_id, status } = req.body;

    const updateData = {};
    if (room_number) updateData.room_number = String(room_number);
    if (category_id && UUID_REGEX.test(category_id)) updateData.category_id = category_id;
    if (floor_id && UUID_REGEX.test(floor_id)) updateData.floor_id = floor_id;
    if (status) updateData.status = status;

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors (id, floor_number, floor_name)
      `)
      .single();

    if (error) throw error;

    // Invalidate affected caches
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    await invalidateRoomsCache(residency_id);

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

    // Delete bookings associated with room first
    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('room_id', id);

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Invalidate affected caches
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    await invalidateRoomsCache(residency_id);

    res.json({ message: 'Room deleted successfully', id });
  } catch (err) {
    logger.error('Failed to delete room', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
}

// GET /api/rooms/categories — List room categories
async function getCategories(req, res) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const cacheKey = `residency:${residency_id}:room_categories`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .select('*')
      .eq('residency_id', residency_id)
      .order('name');

    if (error) throw error;

    // 2. Populate Redis cache
    await setCache(cacheKey, data, TTL.CATEGORIES);

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

    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .insert({
        residency_id,
        name,
        base_price,
        max_occupancy: max_occupancy || 2
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate categories cache
    await invalidateCategoriesCache(residency_id);

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

    // Invalidate categories cache
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    await invalidateCategoriesCache(residency_id);

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

    // Invalidate categories cache
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    await invalidateCategoriesCache(residency_id);

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
