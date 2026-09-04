const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateRoomsCache, invalidateCategoriesCache, TTL } = require('./cache.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RoomService {
  /**
   * Fetch all rooms, optionally filtered by floor_id
   */
  async getRooms({ residencyId, floorId }) {
    const cacheKey = `residency:${residencyId}:rooms:${floorId || 'all'}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let query = supabaseAdmin
      .from('rooms')
      .select(`
        *,
        room_categories (id, name, base_price, max_occupancy),
        floors!inner (id, floor_number, floor_name, residency_id)
      `)
      .eq('floors.residency_id', residencyId)
      .order('room_number', { ascending: true });

    if (floorId) {
      query = query.eq('floor_id', floorId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 2. Populate Redis cache
    await setCache(cacheKey, data, TTL.ROOMS);

    return data;
  }

  /**
   * Fetch a single room by ID, including its active booking if occupied/reserved
   */
  async getRoom({ residencyId, id }) {
    const cacheKey = `residency:${residencyId}:room:${id}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
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
    if (!room) throw new NotFoundError('Room not found');

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

    return result;
  }

  /**
   * Create or update a room with automatic floor and category resolution
   */
  async createRoom({ residencyId, floor_id, room_number, category_id, category_name, base_price, category }) {
    if (!room_number) {
      throw new BadRequestError('room_number is required');
    }

    // 1. Resolve Target Floor UUID
    let resolvedFloorId = floor_id;
    if (!resolvedFloorId || !UUID_REGEX.test(resolvedFloorId)) {
      const { data: allFloors } = await supabaseAdmin
        .from('floors')
        .select('id, floor_number')
        .eq('residency_id', residencyId)
        .order('floor_number', { ascending: true });

      if (allFloors && allFloors.length > 0) {
        resolvedFloorId = allFloors[0].id;
      } else {
        const { data: newFloor, error: fErr } = await supabaseAdmin
          .from('floors')
          .insert({ residency_id: residencyId, floor_number: 0, floor_name: 'Ground Floor' })
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
      const { data: matchedCat } = await supabaseAdmin
        .from('room_categories')
        .select('id, name')
        .eq('residency_id', residencyId)
        .ilike('name', catName)
        .maybeSingle();

      if (matchedCat) {
        resolvedCatId = matchedCat.id;
      } else {
        const { data: newCat, error: catErr } = await supabaseAdmin
          .from('room_categories')
          .insert({
            residency_id: residencyId,
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
    await invalidateRoomsCache(residencyId);

    logger.success(`Room created: ${room_number}`);
    return roomData;
  }

  /**
   * Update room details
   */
  async updateRoom({ residencyId, id, room_number, category_id, floor_id, status }) {
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
    if (!data) throw new NotFoundError('Room not found');

    await invalidateRoomsCache(residencyId);
    return data;
  }

  /**
   * Delete room and cascade delete associated bookings
   */
  async deleteRoom({ residencyId, id }) {
    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('room_id', id);

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await invalidateRoomsCache(residencyId);
    return { message: 'Room deleted successfully', id };
  }

  /**
   * Get all room categories for a residency
   */
  async getCategories(residencyId) {
    const cacheKey = `residency:${residencyId}:room_categories`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .select('*')
      .eq('residency_id', residencyId)
      .order('name');

    if (error) throw error;

    await setCache(cacheKey, data, TTL.CATEGORIES);
    return data;
  }

  /**
   * Create a room category
   */
  async createCategory({ residencyId, name, base_price, max_occupancy }) {
    if (!name || !base_price) {
      throw new BadRequestError('name and base_price are required');
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .insert({
        residency_id: residencyId,
        name,
        base_price,
        max_occupancy: max_occupancy || 2
      })
      .select()
      .single();

    if (error) throw error;

    await invalidateCategoriesCache(residencyId);
    logger.success(`Category created: ${name}`);
    return data;
  }

  /**
   * Update a room category
   */
  async updateCategory({ residencyId, id, name, base_price, max_occupancy }) {
    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .update({ name, base_price, max_occupancy })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Category not found');

    await invalidateCategoriesCache(residencyId);
    return data;
  }

  /**
   * Delete a room category
   */
  async deleteCategory({ residencyId, id }) {
    const { error } = await supabaseAdmin
      .from('room_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await invalidateCategoriesCache(residencyId);
    return { message: 'Category deleted successfully' };
  }
}

module.exports = new RoomService();
