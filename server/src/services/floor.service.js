const { floors, rooms, categories, bookings, customers, generateUuid } = require('./datastore');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateFloorsCache, TTL } = require('./cache.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class FloorService {
  /**
   * Fetch all floors with nested rooms and computed occupancy statistics.
   */
  async getFloors(residencyId) {
    const cacheKey = `residency:${residencyId}:floors`;

    const cachedFloors = await getCache(cacheKey);
    if (cachedFloors) {
      return cachedFloors;
    }

    // Filter floors for this residency
    const residencyFloors = floors
      .filter((f) => !f.residency_id || f.residency_id === residencyId)
      .sort((a, b) => a.floor_number - b.floor_number);

    const customersMap = {};
    customers.forEach((c) => {
      customersMap[c.id] = c;
    });

    // Active bookings map: room_id -> booking
    const activeBookings = bookings.filter((b) =>
      ['booked', 'checked_in'].includes(b.status) &&
      (!b.residency_id || b.residency_id === residencyId)
    );

    const bookingByRoomId = {};
    activeBookings.forEach((b) => {
      let cust = customersMap[b.customer_id] || b.customers || null;
      if (!cust || !cust.full_name || cust.full_name === 'Guest') {
        const found = customers.find(
          (c) => c.id === b.customer_id || (b.phone && c.phone === b.phone)
        );
        if (found) {
          cust = found;
        } else if (b.full_name || b.phone) {
          cust = {
            id: b.customer_id,
            full_name: b.full_name || 'Guest',
            phone: b.phone || '—',
          };
        }
      }

      bookingByRoomId[b.room_id] = {
        ...b,
        customers: cust || { full_name: b.full_name || 'Guest', phone: b.phone || '—' },
      };
    });

    const categoriesMap = {};
    categories.forEach((c) => {
      categoriesMap[c.id] = c;
    });

    const floorsWithStats = residencyFloors.map((floor) => {
      const floorRooms = rooms
        .filter((r) => r.floor_id === floor.id || r.floor_id === `floor-${floor.floor_number}`)
        .map((room) => {
          const category = categoriesMap[room.category_id] || {
            id: room.category_id,
            name: 'Standard',
            base_price: 1500,
            max_occupancy: 2,
          };

          return {
            ...room,
            floor_name: floor.floor_name,
            room_categories: category,
            active_booking: bookingByRoomId[room.id] || null,
          };
        })
        .sort((a, b) => {
          const numA = parseInt(a.room_number, 10);
          const numB = parseInt(b.room_number, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.room_number).localeCompare(String(b.room_number));
        });

      const totalRooms = floorRooms.length;
      const occupiedRooms = floorRooms.filter((r) => r.status === 'occupied').length;
      const availableRooms = floorRooms.filter((r) => r.status === 'available').length;
      const reservedRooms = floorRooms.filter((r) => r.status === 'reserved').length;

      return {
        ...floor,
        rooms: floorRooms,
        stats: { totalRooms, occupiedRooms, availableRooms, reservedRooms },
      };
    });

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
      const maxFloor = floors.length > 0 ? Math.max(...floors.map((f) => f.floor_number)) : -1;
      resolvedFloorNumber = maxFloor + 1;
    } else {
      resolvedFloorNumber = Number(resolvedFloorNumber);
    }

    const resolvedFloorName = (floorName ? String(floorName).trim() : '') || (resolvedFloorNumber === 0 ? 'Ground Floor' : `Floor ${resolvedFloorNumber}`);

    const existingFloor = floors.find(
      (f) => (!f.residency_id || f.residency_id === residencyId) && f.floor_number === resolvedFloorNumber
    );

    if (existingFloor) {
      existingFloor.floor_name = resolvedFloorName;
      await invalidateFloorsCache(residencyId);
      return { floor: { ...existingFloor, rooms: [] }, isNew: false };
    }

    const newFloor = {
      id: generateUuid(),
      residency_id: residencyId,
      floor_number: resolvedFloorNumber,
      floor_name: resolvedFloorName,
      created_at: new Date().toISOString(),
    };

    floors.push(newFloor);
    await invalidateFloorsCache(residencyId);
    logger.success(`Floor created: ${resolvedFloorName} (${resolvedFloorNumber})`);

    return { floor: { ...newFloor, rooms: [] }, isNew: true };
  }

  /**
   * Update floor details
   */
  async updateFloor({ id, residencyId, floorNumber, floorName }) {
    if (!id) throw new BadRequestError('Floor id is required');

    let targetFloor = floors.find((f) => f.id === id);
    if (!targetFloor && !UUID_REGEX.test(id)) {
      const cleanNum = parseInt(String(id).replace(/^floor-/, ''), 10);
      targetFloor = floors.find((f) => f.floor_number === cleanNum);
    }

    if (!targetFloor) throw new NotFoundError('Floor not found');

    if (floorNumber !== undefined && floorNumber !== null && !isNaN(Number(floorNumber))) {
      targetFloor.floor_number = Number(floorNumber);
    }
    if (floorName) {
      targetFloor.floor_name = String(floorName).trim();
    }

    await invalidateFloorsCache(residencyId);
    return targetFloor;
  }

  /**
   * Delete a floor and cascade associated rooms/bookings
   */
  async deleteFloor({ id, residencyId }) {
    if (!id) return { message: 'Floor deleted successfully' };

    let floorIndex = floors.findIndex((f) => f.id === id);
    if (floorIndex === -1 && !UUID_REGEX.test(id)) {
      const cleanNum = parseInt(String(id).replace(/^floor-/, ''), 10);
      floorIndex = floors.findIndex((f) => f.floor_number === cleanNum);
    }

    if (floorIndex === -1) {
      await invalidateFloorsCache(residencyId);
      return { message: 'Floor pruned successfully', id };
    }

    const deletedFloor = floors.splice(floorIndex, 1)[0];

    // Cascade delete rooms and bookings
    const roomsToDelete = rooms.filter((r) => r.floor_id === deletedFloor.id);
    const roomIds = roomsToDelete.map((r) => r.id);

    for (let i = rooms.length - 1; i >= 0; i--) {
      if (rooms[i].floor_id === deletedFloor.id) {
        rooms.splice(i, 1);
      }
    }

    for (let i = bookings.length - 1; i >= 0; i--) {
      if (roomIds.includes(bookings[i].room_id)) {
        bookings.splice(i, 1);
      }
    }

    await invalidateFloorsCache(residencyId);
    return { message: 'Floor deleted successfully', id: deletedFloor.id };
  }
}

module.exports = new FloorService();
