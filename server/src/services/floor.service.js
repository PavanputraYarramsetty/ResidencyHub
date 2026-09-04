const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateFloorsCache, TTL } = require('./cache.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class FloorService {
  /**
   * Fetch all floors with nested rooms and computed occupancy statistics.
   * Leverages Redis caching for rapid response.
   */
  async getFloors(residencyId) {
    const cacheKey = `residency:${residencyId}:floors`;

    // 1. Try Redis cache
    const cachedFloors = await getCache(cacheKey);
    if (cachedFloors) {
      return cachedFloors;
    }

    // 2. Query Supabase on cache miss
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
      .eq('residency_id', residencyId)
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

    // 3. Populate Redis cache
    await setCache(cacheKey, floorsWithStats, TTL.FLOORS);

    return floorsWithStats;
  }

  /**
   * Create or upsert a floor for a residency
   */
  async createFloor({ residencyId, floorNumber, floorName }) {
    if (floorNumber === undefined && !floorName) {
      throw new BadRequestError('floor_number or floor_name is required');
    }

    let resolvedFloorNumber = floorNumber;
    if (resolvedFloorNumber === undefined || resolvedFloorNumber === null || resolvedFloorNumber === '' || isNaN(Number(resolvedFloorNumber))) {
      const { data: existingFloors } = await supabaseAdmin
        .from('floors')
        .select('floor_number')
        .eq('residency_id', residencyId)
        .order('floor_number', { ascending: false })
        .limit(1);

      const maxFloor = existingFloors && existingFloors.length > 0 ? existingFloors[0].floor_number : -1;
      resolvedFloorNumber = maxFloor + 1;
    } else {
      resolvedFloorNumber = Number(resolvedFloorNumber);
    }

    const resolvedFloorName = (floorName ? String(floorName).trim() : '') || (resolvedFloorNumber === 0 ? 'Ground Floor' : `Floor ${resolvedFloorNumber}`);

    // Check if floor with floor_number already exists
    const { data: existingFloor } = await supabaseAdmin
      .from('floors')
      .select('*, rooms(*, room_categories(*))')
      .eq('residency_id', residencyId)
      .eq('floor_number', resolvedFloorNumber)
      .limit(1)
      .maybeSingle();

    if (existingFloor) {
      const { data: updatedFloor, error: updErr } = await supabaseAdmin
        .from('floors')
        .update({ floor_name: resolvedFloorName })
        .eq('id', existingFloor.id)
        .select('*, rooms(*, room_categories(*))')
        .single();

      if (updErr) throw updErr;

      await invalidateFloorsCache(residencyId);
      return { floor: updatedFloor || existingFloor, isNew: false };
    }

    const { data, error } = await supabaseAdmin
      .from('floors')
      .insert({
        residency_id: residencyId,
        floor_number: resolvedFloorNumber,
        floor_name: resolvedFloorName
      })
      .select('*, rooms(*, room_categories(*))')
      .single();

    if (error) {
      // If unique constraint collision, gracefully update
      if (error.code === '23505') {
        const { data: fallbackFloor } = await supabaseAdmin
          .from('floors')
          .update({ floor_name: resolvedFloorName })
          .eq('residency_id', residencyId)
          .eq('floor_number', resolvedFloorNumber)
          .select('*, rooms(*, room_categories(*))')
          .single();

        await invalidateFloorsCache(residencyId);
        return { floor: fallbackFloor, isNew: false };
      }
      throw error;
    }

    await invalidateFloorsCache(residencyId);
    logger.success(`Floor created: ${resolvedFloorName} (${resolvedFloorNumber})`);

    return { floor: { ...data, rooms: data.rooms || [] }, isNew: true };
  }

  /**
   * Update floor details
   */
  async updateFloor({ id, residencyId, floorNumber, floorName }) {
    if (!id) throw new BadRequestError('Floor id is required');

    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const cleanNum = parseInt(String(targetId).replace(/^floor-/, ''), 10);
      if (!isNaN(cleanNum)) {
        const { data: matchedFloor } = await supabaseAdmin
          .from('floors')
          .select('id')
          .eq('residency_id', residencyId)
          .eq('floor_number', cleanNum)
          .limit(1)
          .maybeSingle();

        if (matchedFloor) targetId = matchedFloor.id;
      }
    }

    const updateFields = {};
    if (floorNumber !== undefined && floorNumber !== null && !isNaN(Number(floorNumber))) {
      updateFields.floor_number = Number(floorNumber);
    }
    if (floorName) {
      updateFields.floor_name = String(floorName).trim();
    }

    const { data, error } = await supabaseAdmin
      .from('floors')
      .update(updateFields)
      .eq('id', targetId)
      .select('*, rooms(*, room_categories(*))')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Floor not found');

    await invalidateFloorsCache(residencyId);
    return data;
  }

  /**
   * Delete a floor and cascade associated rooms/bookings
   */
  async deleteFloor({ id, residencyId }) {
    if (!id) return { message: 'Floor deleted successfully' };

    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const cleanNum = parseInt(String(targetId).replace(/^floor-/, ''), 10);
      if (!isNaN(cleanNum)) {
        const { data: matchedFloor } = await supabaseAdmin
          .from('floors')
          .select('id')
          .eq('residency_id', residencyId)
          .eq('floor_number', cleanNum)
          .limit(1)
          .maybeSingle();

        if (matchedFloor) {
          targetId = matchedFloor.id;
        } else {
          // Ghost/mock floor pruned locally; return success
          await invalidateFloorsCache(residencyId);
          return { message: 'Floor pruned successfully', id };
        }
      } else {
        await invalidateFloorsCache(residencyId);
        return { message: 'Floor pruned successfully', id };
      }
    }

    // First get rooms on this floor to cascade delete bookings
    const { data: roomsOnFloor } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('floor_id', targetId);

    if (roomsOnFloor && roomsOnFloor.length > 0) {
      const roomIds = roomsOnFloor.map(r => r.id);
      await supabaseAdmin.from('bookings').delete().in('room_id', roomIds);
      await supabaseAdmin.from('rooms').delete().eq('floor_id', targetId);
    }

    const { error } = await supabaseAdmin
      .from('floors')
      .delete()
      .eq('id', targetId);

    if (error && error.code !== 'PGRST116') throw error;

    await invalidateFloorsCache(residencyId);
    return { message: 'Floor deleted successfully', id: targetId };
  }
}

module.exports = new FloorService();
