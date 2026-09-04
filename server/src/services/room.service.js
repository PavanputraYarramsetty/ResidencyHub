const { rooms, floors, categories, bookings, customers, generateUuid } = require('./datastore');
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

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const categoriesMap = {};
    categories.forEach((c) => { categoriesMap[c.id] = c; });

    const floorsMap = {};
    floors.forEach((f) => { floorsMap[f.id] = f; });

    let filteredRooms = rooms.filter((r) => !r.residency_id || r.residency_id === residencyId);
    if (floorId) {
      filteredRooms = filteredRooms.filter((r) => r.floor_id === floorId || r.floor_id === `floor-${floorId}`);
    }

    const enrichedRooms = filteredRooms
      .map((r) => ({
        ...r,
        room_categories: categoriesMap[r.category_id] || { id: r.category_id, name: 'Standard', base_price: 1500, max_occupancy: 2 },
        floors: floorsMap[r.floor_id] || { id: r.floor_id, floor_number: 0, floor_name: 'Ground Floor' },
      }))
      .sort((a, b) => {
        const numA = parseInt(a.room_number, 10);
        const numB = parseInt(b.room_number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.room_number).localeCompare(String(b.room_number));
      });

    await setCache(cacheKey, enrichedRooms, TTL.ROOMS);
    return enrichedRooms;
  }

  /**
   * Fetch a single room by ID, including its active booking if occupied/reserved
   */
  async getRoom({ residencyId, id }) {
    const cacheKey = `residency:${residencyId}:room:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const room = rooms.find((r) => r.id === id || r.room_number === String(id).replace(/^r-/, ''));
    if (!room) throw new NotFoundError('Room not found');

    const cat = categories.find((c) => c.id === room.category_id) || { id: room.category_id, name: 'Standard', base_price: 1500, max_occupancy: 2 };
    const flr = floors.find((f) => f.id === room.floor_id) || { id: room.floor_id, floor_number: 0, floor_name: 'Ground Floor' };

    let activeBooking = null;
    if (room.status === 'occupied' || room.status === 'reserved') {
      const b = bookings
        .filter((bk) => bk.room_id === room.id && ['booked', 'checked_in'].includes(bk.status))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (b) {
        const cust = customers.find((c) => c.id === b.customer_id) || b.customers || null;
        activeBooking = { ...b, customers: cust };
      }
    }

    const result = {
      ...room,
      room_categories: cat,
      floors: flr,
      active_booking: activeBooking,
    };

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

    // 1. Resolve Target Floor
    let targetFloor = floors.find((f) => f.id === floor_id);
    if (!targetFloor && floor_id) {
      const parsedFloorNum = parseInt(String(floor_id).replace(/^floor-/, ''), 10);
      if (!isNaN(parsedFloorNum)) {
        targetFloor = floors.find((f) => f.floor_number === parsedFloorNum);
      }
    }
    if (!targetFloor) {
      targetFloor = floors[0] || {
        id: generateUuid(),
        residency_id: residencyId,
        floor_number: 0,
        floor_name: 'Ground Floor',
        created_at: new Date().toISOString(),
      };
      if (!floors.includes(targetFloor)) floors.push(targetFloor);
    }

    // 2. Resolve Category
    const catName = (category_name || category?.name || (typeof category_id === 'string' && !UUID_REGEX.test(category_id) ? category_id : 'Standard')).trim();
    const catPrice = Number(base_price || category?.base_price || 1500);

    let targetCat = categories.find((c) => c.id === category_id);
    if (!targetCat && catName) {
      targetCat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (!targetCat) {
        targetCat = {
          id: generateUuid(),
          residency_id: residencyId,
          name: catName,
          base_price: catPrice > 0 ? catPrice : 1500,
          max_occupancy: 2,
          created_at: new Date().toISOString(),
        };
        categories.push(targetCat);
      }
    }
    if (!targetCat) targetCat = categories[0];

    // 3. Check if room already exists
    let existingRoom = rooms.find(
      (r) => r.floor_id === targetFloor.id && r.room_number === trimmedRoomNum
    );

    if (existingRoom) {
      existingRoom.status = 'available';
      if (targetCat) existingRoom.category_id = targetCat.id;
    } else {
      existingRoom = {
        id: generateUuid(),
        residency_id: residencyId,
        floor_id: targetFloor.id,
        category_id: targetCat.id,
        room_number: trimmedRoomNum,
        status: 'available',
        created_at: new Date().toISOString(),
      };
      rooms.push(existingRoom);
    }

    await invalidateRoomsCache(residencyId);
    logger.success(`Room created/updated: ${trimmedRoomNum}`);

    return {
      ...existingRoom,
      room_categories: targetCat,
      floors: targetFloor,
    };
  }

  /**
   * Update room details
   */
  async updateRoom({ residencyId, id, room_number, category_id, floor_id, status, category_name, base_price }) {
    if (!id) throw new BadRequestError('Room id is required');

    let targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) {
      const cleanNum = String(id).replace(/^r-/, '');
      targetRoom = rooms.find((r) => r.room_number === cleanNum);
    }

    if (!targetRoom) throw new NotFoundError('Room not found');

    if (room_number) targetRoom.room_number = String(room_number).trim();
    if (category_id) targetRoom.category_id = category_id;
    if (floor_id) targetRoom.floor_id = floor_id;
    if (status) targetRoom.status = status;

    if (!category_id && category_name) {
      const catName = String(category_name).trim();
      let matchedCat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (!matchedCat) {
        matchedCat = {
          id: generateUuid(),
          residency_id: residencyId,
          name: catName,
          base_price: Number(base_price) || 1500,
          max_occupancy: 2,
          created_at: new Date().toISOString(),
        };
        categories.push(matchedCat);
      }
      targetRoom.category_id = matchedCat.id;
    }

    const cat = categories.find((c) => c.id === targetRoom.category_id) || categories[0];
    const flr = floors.find((f) => f.id === targetRoom.floor_id) || floors[0];

    await invalidateRoomsCache(residencyId);
    return {
      ...targetRoom,
      room_categories: cat,
      floors: flr,
    };
  }

  /**
   * Delete room and cascade delete associated bookings
   */
  async deleteRoom({ residencyId, id }) {
    if (!id) return { message: 'Room deleted successfully' };

    let roomIndex = rooms.findIndex((r) => r.id === id);
    if (roomIndex === -1) {
      const cleanNum = String(id).replace(/^r-/, '');
      roomIndex = rooms.findIndex((r) => r.room_number === cleanNum);
    }

    if (roomIndex === -1) {
      await invalidateRoomsCache(residencyId);
      return { message: 'Room pruned successfully', id };
    }

    const deletedRoom = rooms.splice(roomIndex, 1)[0];

    // Cascade delete bookings for this room
    for (let i = bookings.length - 1; i >= 0; i--) {
      if (bookings[i].room_id === deletedRoom.id) {
        bookings.splice(i, 1);
      }
    }

    await invalidateRoomsCache(residencyId);
    return { message: 'Room deleted successfully', id: deletedRoom.id };
  }

  /**
   * Get all room categories for a residency
   */
  async getCategories(residencyId) {
    const cacheKey = `residency:${residencyId}:room_categories`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const resCategories = categories.filter((c) => !c.residency_id || c.residency_id === residencyId);
    await setCache(cacheKey, resCategories, TTL.CATEGORIES);
    return resCategories;
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

    let existingCat = categories.find(
      (c) => (!c.residency_id || c.residency_id === residencyId) && c.name.toLowerCase() === catName.toLowerCase()
    );

    if (existingCat) {
      existingCat.base_price = price;
      existingCat.max_occupancy = Number(max_occupancy) || 2;
      await invalidateCategoriesCache(residencyId);
      return existingCat;
    }

    const newCat = {
      id: generateUuid(),
      residency_id: residencyId,
      name: catName,
      base_price: price,
      max_occupancy: Number(max_occupancy) || 2,
      created_at: new Date().toISOString(),
    };

    categories.push(newCat);
    await invalidateCategoriesCache(residencyId);
    logger.success(`Category created: ${catName}`);
    return newCat;
  }

  /**
   * Update a room category
   */
  async updateCategory({ residencyId, id, name, base_price, max_occupancy }) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) throw new NotFoundError('Category not found');

    if (name) cat.name = String(name).trim();
    if (base_price) cat.base_price = Number(base_price);
    if (max_occupancy) cat.max_occupancy = Number(max_occupancy);

    await invalidateCategoriesCache(residencyId);
    return cat;
  }

  /**
   * Delete a room category
   */
  async deleteCategory({ residencyId, id }) {
    const catIndex = categories.findIndex((c) => c.id === id);
    if (catIndex === -1) return { message: 'Category pruned successfully' };

    categories.splice(catIndex, 1);
    const fallbackCat = categories[0] || null;

    rooms.forEach((r) => {
      if (r.category_id === id) {
        r.category_id = fallbackCat ? fallbackCat.id : null;
      }
    });

    await invalidateCategoriesCache(residencyId);
    return { message: 'Category deleted successfully' };
  }
}

module.exports = new RoomService();
