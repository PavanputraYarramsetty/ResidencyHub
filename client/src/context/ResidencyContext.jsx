import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ResidencyContext = createContext(null);

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'AC Single', base_price: 1500, max_occupancy: 1 },
  { id: 'cat-2', name: 'AC Double', base_price: 2000, max_occupancy: 2 },
  { id: 'cat-3', name: 'Non-AC Single', base_price: 800, max_occupancy: 1 },
  { id: 'cat-4', name: 'Non-AC Double', base_price: 1200, max_occupancy: 2 },
  { id: 'cat-5', name: 'Deluxe Suite', base_price: 3000, max_occupancy: 3 },
];

const INITIAL_MOCK_FLOORS = [
  {
    id: 'floor-ground',
    floor_number: 0,
    floor_name: 'Ground Floor',
    stats: { totalRooms: 5, occupiedRooms: 1, availableRooms: 4, reservedRooms: 0 },
    rooms: [
      { id: 'r101', room_number: '101', status: 'available', category_id: 'cat-3', room_categories: MOCK_CATEGORIES[2] },
      { id: 'r102', room_number: '102', status: 'available', category_id: 'cat-3', room_categories: MOCK_CATEGORIES[2] },
      { id: 'r103', room_number: '103', status: 'available', category_id: 'cat-4', room_categories: MOCK_CATEGORIES[3] },
      { id: 'r104', room_number: '104', status: 'occupied', category_id: 'cat-4', room_categories: MOCK_CATEGORIES[3], active_booking: { id: 'bk-104', customers: { full_name: 'Satyanarayana Murthy', phone: '98480 22338', aadhar_number: '4523 8891 0042' }, check_in: new Date(Date.now() - 4 * 3600000).toISOString(), rate_per_day: 1200, no_of_persons: 2, status: 'checked_in' } },
      { id: 'r105', room_number: '105', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
    ]
  },
  {
    id: 'floor-1st',
    floor_number: 1,
    floor_name: '1st Floor',
    stats: { totalRooms: 6, occupiedRooms: 1, availableRooms: 5, reservedRooms: 0 },
    rooms: [
      { id: 'r201', room_number: '201', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
      { id: 'r202', room_number: '202', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
      { id: 'r203', room_number: '203', status: 'occupied', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1], active_booking: { id: 'bk-203', customers: { full_name: 'K. V. Rao', phone: '94910 08797', aadhar_number: '8821 3340 9912' }, check_in: new Date(Date.now() - 6 * 3600000).toISOString(), rate_per_day: 2000, no_of_persons: 2, status: 'checked_in' } },
      { id: 'r204', room_number: '204', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r205', room_number: '205', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r206', room_number: '206', status: 'available', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
    ]
  },
  {
    id: 'floor-2nd',
    floor_number: 2,
    floor_name: '2nd Floor',
    stats: { totalRooms: 5, occupiedRooms: 0, availableRooms: 5, reservedRooms: 0 },
    rooms: [
      { id: 'r301', room_number: '301', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r302', room_number: '302', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r303', room_number: '303', status: 'available', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
      { id: 'r304', room_number: '304', status: 'available', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
      { id: 'r305', room_number: '305', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
    ]
  }
];

export function ResidencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  // Load saved floors from localStorage if available
  const [floors, setFloors] = useState(() => {
    const saved = localStorage.getItem('residency_floors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MOCK_FLOORS;
  });

  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('residency_floors', JSON.stringify(floors));
  }, [floors]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFloors();
      fetchCategories();
    }
  }, [isAuthenticated]);

  async function fetchFloors() {
    try {
      setLoading(true);
      const { data } = await api.get('/floors');
      if (Array.isArray(data) && data.length > 0) {
        // Merge with local overrides if room was marked occupied/available locally
        const saved = localStorage.getItem('residency_floors');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const statusMap = new Map();
            parsed.forEach((pf) => {
              (pf.rooms || []).forEach((pr) => {
                statusMap.set(pr.id, { status: pr.status, active_booking: pr.active_booking });
                statusMap.set(String(pr.room_number), { status: pr.status, active_booking: pr.active_booking });
              });
            });

            const mergedFloors = data.map((f) => ({
              ...f,
              rooms: (f.rooms || []).map((r) => {
                const override = statusMap.get(r.id) || statusMap.get(String(r.room_number));
                if (override) {
                  return {
                    ...r,
                    status: override.status || r.status,
                    active_booking: override.active_booking !== undefined ? override.active_booking : r.active_booking,
                  };
                }
                return r;
              }),
            }));
            setFloors(mergedFloors);
            return;
          } catch (e) {
            /* ignore */
          }
        }
        setFloors(data);
      }
    } catch (err) {
      // Keep local state
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get('/rooms/categories');
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      /* ignore */
    }
  }

  // Mark room occupied
  function markRoomOccupied(roomId, bookingData) {
    setFloors((prevFloors) => {
      const updated = prevFloors.map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => {
          if (room.id === roomId || String(room.room_number) === String(roomId)) {
            const dailyRate = bookingData.rate_per_day || room.room_categories?.base_price || 1000;
            const days = bookingData.no_of_days || 1;
            const advance = Number(bookingData.advance_amount || 0);
            return {
              ...room,
              status: 'occupied',
              active_booking: {
                id: `bk-${Date.now()}`,
                customers: {
                  full_name: bookingData.full_name,
                  phone: bookingData.phone,
                  aadhar_number: bookingData.aadhar_number,
                  address: bookingData.address,
                },
                check_in: bookingData.check_in || new Date().toISOString(),
                rate_per_day: dailyRate,
                no_of_persons: bookingData.no_of_persons || 1,
                no_of_days: days,
                advance_amount: advance,
                total_amount: bookingData.total_amount || dailyRate * days,
                status: 'checked_in',
              },
            };
          }
          return room;
        }),
      }));
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      return updated;
    });
  }

  // Mark room available on checkout
  function markRoomAvailable(roomId, checkoutSummary) {
    setFloors((prevFloors) =>
      prevFloors.map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => {
          if (room.id === roomId) {
            return {
              ...room,
              status: 'available',
              active_booking: null,
            };
          }
          return room;
        }),
      }))
    );

    // Save checkout log to localStorage for Statistics & Revenue
    const savedLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
    const newLog = {
      id: `checkout-${Date.now()}`,
      rooms: { room_number: checkoutSummary.room_number, room_categories: { name: checkoutSummary.category_name || 'Standard' } },
      customers: { full_name: checkoutSummary.full_name, phone: checkoutSummary.phone },
      check_in: checkoutSummary.check_in,
      check_out: new Date().toISOString(),
      billable_days: checkoutSummary.billable_days || 1,
      total_amount: checkoutSummary.net_total,
      payment_mode: checkoutSummary.payment_mode || 'UPI',
    };
    localStorage.setItem('residency_audit_ledger', JSON.stringify([newLog, ...savedLedger]));
  }

  // Structural Management — Add Floor
  function addFloor(floorName, floorNumber) {
    setFloors((prev) => {
      const newFloor = {
        id: `floor-${Date.now()}`,
        floor_number: Number(floorNumber) || prev.length,
        floor_name: floorName || `Floor ${prev.length + 1}`,
        stats: { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, reservedRooms: 0 },
        rooms: [],
      };
      const updated = [...prev, newFloor];
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      return updated;
    });
  }

  // Structural Management — Delete Floor
  function deleteFloor(floorId) {
    setFloors((prev) => {
      const updated = prev.filter((f) => f.id !== floorId);
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      return updated;
    });
  }

  // Structural Management — Add Room to Floor
  function addRoom(floorId, roomData) {
    setFloors((prev) => {
      const updated = prev.map((f) => {
        if (f.id === floorId) {
          const categoryObj = roomData.category || {
            id: roomData.category_id || 'cat-1',
            name: roomData.category_name || 'AC Single',
            base_price: Number(roomData.base_price) || 1500,
          };
          const newRoom = {
            id: `r-${Date.now()}`,
            room_number: roomData.room_number,
            status: 'available',
            category_id: categoryObj.id,
            room_categories: categoryObj,
          };
          return {
            ...f,
            rooms: [...(f.rooms || []), newRoom],
          };
        }
        return f;
      });
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      return updated;
    });
  }

  // Structural Management — Delete Room
  function deleteRoom(floorId, roomId) {
    setFloors((prev) => {
      const updated = prev.map((f) => {
        if (f.id === floorId) {
          return {
            ...f,
            rooms: (f.rooms || []).filter((r) => r.id !== roomId),
          };
        }
        return f;
      });
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      return updated;
    });
  }

  const value = {
    floors,
    categories,
    loading,
    refreshData: fetchFloors,
    refreshFloors: fetchFloors,
    refreshCategories: fetchCategories,
    markRoomOccupied,
    markRoomAvailable,
    addFloor,
    deleteFloor,
    addRoom,
    deleteRoom,
  };

  return <ResidencyContext.Provider value={value}>{children}</ResidencyContext.Provider>;
}

export function useResidency() {
  const context = useContext(ResidencyContext);
  if (!context) throw new Error('useResidency must be used within ResidencyProvider');
  return context;
}

export default ResidencyContext;
