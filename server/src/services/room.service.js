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

    const trimmedRoomNum = String(room_number).trim();

    // 1. Resolve Target Floor UUID (guaranteed to be an actual existing floor in DB)
    let resolvedFloorId = null;

    if (floor_id && UUID_REGEX.test(floor_id)) {
      const { data: existingFloor } = await supabaseAdmin
        .from('floors')
        .select('id')
        .eq('id', floor_id)
        .eq('residency_id', residencyId)
        .limit(1)
        .maybeSingle();

      if (existingFloor) {
        resolvedFloorId = existingFloor.id;
      }
    }

    // If not resolved, check if floor_id contains a floor index (e.g. 'floor-1', '1', 'Ground Floor')
    if (!resolvedFloorId && floor_id) {
      const parsedFloorNum = parseInt(String(floor_id).replace(/^floor-/, ''), 10);
      if (!isNaN(parsedFloorNum)) {
        const { data: floorByNum } = await supabaseAdmin
          .from('floors')
          .select('id')
          .eq('residency_id', residencyId)
          .eq('floor_number', parsedFloorNum)
          .limit(1)
          .maybeSingle();

        if (floorByNum) resolvedFloorId = floorByNum.id;
      }
    }

    // Fallback: pick the first available floor for this residency, or create Ground Floor
    if (!resolvedFloorId) {
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
        .limit(1)
        .maybeSingle();
      if (existingCat) {
        resolvedCatId = existingCat.id;
      }
    }

    if (!resolvedCatId && catName) {
      const { data: matchedCat } = await supabaseAdmin
        .from('room_categories')
        .select('id, name')
        .eq('residency_id', residencyId)
        .ilike('name', catName)
        .limit(1)
        .maybeSingle();

      if (matchedCat) {
        resolvedCatId = matchedCat.id;
      } else {
        const { data: newCat, error: catErr } = await supabaseAdmin
          .from('room_categories')
          .insert({
            residency_id: residencyId,
            name: catName,
            base_price: catPrice > 0 ? catPrice : 1500,
            max_occupancy: 2
          })
          .select()
          .single();

        if (!catErr && newCat) {
          resolvedCatId = newCat.id;
        } else {
          // Fallback if concurrent insert or conflict
          const { data: fallbackCat } = await supabaseAdmin
            .from('room_categories')
            .select('id')
            .eq('residency_id', residencyId)
            .limit(1)
            .maybeSingle();
          if (fallbackCat) resolvedCatId = fallbackCat.id;
        }
      }
    }

    // 3. Check if room already exists on this floor
    const { data: existingRoom } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('floor_id', resolvedFloorId)
      .eq('room_number', trimmedRoomNum)
      .limit(1)
      .maybeSingle();

    let roomData;
    if (existingRoom) {
      const updateFields = { status: 'available' };
      if (resolvedCatId) updateFields.category_id = resolvedCatId;

      const { data: updRoom, error: updErr } = await supabaseAdmin
        .from('rooms')
        .update(updateFields)
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
      const insertFields = {
        floor_id: resolvedFloorId,
        room_number: trimmedRoomNum,
        status: 'available'
      };
      if (resolvedCatId) insertFields.category_id = resolvedCatId;

      const { data: insRoom, error: insErr } = await supabaseAdmin
        .from('rooms')
        .insert(insertFields)
        .select(`
          *,
          room_categories (id, name, base_price, max_occupancy),
          floors (id, floor_number, floor_name)
        `)
        .single();

      if (insErr) {
        // If unique constraint error (room exists), gracefully update
        if (insErr.code === '23505') {
          const { data: retryRoom } = await supabaseAdmin
            .from('rooms')
            .update({ category_id: resolvedCatId, status: 'available' })
            .eq('floor_id', resolvedFloorId)
            .eq('room_number', trimmedRoomNum)
            .select(`
              *,
              room_categories (id, name, base_price, max_occupancy),
              floors (id, floor_number, floor_name)
            `)
            .single();
          roomData = retryRoom;
        } else {
          throw insErr;
        }
      } else {
        roomData = insRoom;
      }
    }

    // 4. Invalidate affected caches
    await invalidateRoomsCache(residencyId);

    logger.success(`Room created/updated: ${trimmedRoomNum}`);
    return roomData;
  }

  /**
   * Update room details
   */
  async updateRoom({ residencyId, id, room_number, category_id, floor_id, status, category_name, base_price }) {
    if (!id) throw new BadRequestError('Room id is required');

    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const cleanNum = String(targetId).replace(/^r-/, '');
      const { data: matchedRoom } = await supabaseAdmin
        .from('rooms')
        .select('id, floors!inner(residency_id)')
        .eq('floors.residency_id', residencyId)
        .eq('room_number', cleanNum)
        .limit(1)
        .maybeSingle();

      if (matchedRoom) {
        targetId = matchedRoom.id;
      } else {
        throw new NotFoundError('Room not found');
      }
    }

    const updateData = {};
    if (room_number) updateData.room_number = String(room_number).trim();
    if (category_id && UUID_REGEX.test(category_id)) updateData.category_id = category_id;
    if (floor_id && UUID_REGEX.test(floor_id)) updateData.floor_id = floor_id;
    if (status) updateData.status = status;

    // Resolve category by name/price if provided without category_id
    if (!updateData.category_id && category_name) {
      const catName = String(category_name).trim();
      const catPrice = Number(base_price) || 1500;
      const { data: matchedCat } = await supabaseAdmin
        .from('room_categories')
        .select('id')
        .eq('residency_id', residencyId)
        .ilike('name', catName)
        .limit(1)
        .maybeSingle();

      if (matchedCat) {
        updateData.category_id = matchedCat.id;
      } else {
        const { data: newCat } = await supabaseAdmin
          .from('room_categories')
          .insert({
            residency_id: residencyId,
            name: catName,
            base_price: catPrice,
            max_occupancy: 2
          })
          .select()
          .single();
        if (newCat) updateData.category_id = newCat.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updateData)
      .eq('id', targetId)
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
    if (!id) return { message: 'Room deleted successfully' };

    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const cleanNum = String(targetId).replace(/^r-/, '');
      const { data: matchedRoom } = await supabaseAdmin
        .from('rooms')
        .select('id, floors!inner(residency_id)')
        .eq('floors.residency_id', residencyId)
        .eq('room_number', cleanNum)
        .limit(1)
        .maybeSingle();

      if (matchedRoom) {
        targetId = matchedRoom.id;
      } else {
        // Ghost/mock room pruned locally; return success
        await invalidateRoomsCache(residencyId);
        return { message: 'Room pruned successfully', id };
      }
    }

    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('room_id', targetId);

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', targetId);

    if (error && error.code !== 'PGRST116') throw error;

    await invalidateRoomsCache(residencyId);
    return { message: 'Room deleted successfully', id: targetId };
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

    const catName = String(name).trim();
    const price = Number(base_price) || 1500;

    // Check if category already exists
    const { data: existingCat } = await supabaseAdmin
      .from('room_categories')
      .select('*')
      .eq('residency_id', residencyId)
      .ilike('name', catName)
      .limit(1)
      .maybeSingle();

    if (existingCat) {
      const { data: updatedCat, error: updErr } = await supabaseAdmin
        .from('room_categories')
        .update({ base_price: price, max_occupancy: Number(max_occupancy) || 2 })
        .eq('id', existingCat.id)
        .select()
        .single();
      if (updErr) throw updErr;
      await invalidateCategoriesCache(residencyId);
      return updatedCat;
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .insert({
        residency_id: residencyId,
        name: catName,
        base_price: price,
        max_occupancy: max_occupancy || 2
      })
      .select()
      .single();

    if (error) throw error;

    await invalidateCategoriesCache(residencyId);
    logger.success(`Category created: ${catName}`);
    return data;
  }

  /**
   * Update a room category
   */
  async updateCategory({ residencyId, id, name, base_price, max_occupancy }) {
    if (!UUID_REGEX.test(id)) {
      return { id, name, base_price, max_occupancy };
    }

    const { data, error } = await supabaseAdmin
      .from('room_categories')
      .update({ name: String(name).trim(), base_price: Number(base_price), max_occupancy })
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
    if (!UUID_REGEX.test(id)) {
      return { message: 'Category pruned successfully' };
    }

    // Reassign any rooms that reference this category
    const { data: fallbackCat } = await supabaseAdmin
      .from('room_categories')
      .select('id')
      .eq('residency_id', residencyId)
      .neq('id', id)
      .limit(1)
      .maybeSingle();

    const fallbackId = fallbackCat ? fallbackCat.id : null;
    await supabaseAdmin
      .from('rooms')
      .update({ category_id: fallbackId })
      .eq('category_id', id);

    const { error } = await supabaseAdmin
      .from('room_categories')
      .delete()
      .eq('id', id);

    if (error && error.code !== 'PGRST116') throw error;

    await invalidateCategoriesCache(residencyId);
    return { message: 'Category deleted successfully' };
  }
}

module.exports = new RoomService();
