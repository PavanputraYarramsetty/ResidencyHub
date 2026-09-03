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

const INITIAL_MOCK_FLOORS = [];

export function ResidencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  // Load saved floors from localStorage if available
  const [floors, setFloors] = useState(() => {
    const saved = localStorage.getItem('residency_floors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
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
                  age: bookingData.age || null,
                  gender: bookingData.gender || 'Male',
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

  useEffect(() => {
    function handleSync() {
      const saved = localStorage.getItem('residency_floors');
      if (saved) {
        try {
          setFloors(JSON.parse(saved));
        } catch (e) { /* ignore */ }
      }
    }

    window.addEventListener('storage', handleSync);
    window.addEventListener('residency_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('residency_updated', handleSync);
    };
  }, []);

  // Structural Management — Add Floor
  async function addFloor(floorName, floorNumber) {
    const newFloorId = `floor-${Date.now()}`;
    const newFloor = {
      id: newFloorId,
      floor_number: Number(floorNumber) || floors.length,
      floor_name: floorName || `Floor ${floors.length + 1}`,
      stats: { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, reservedRooms: 0 },
      rooms: [],
    };

    const updated = [...floors, newFloor];
    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    window.dispatchEvent(new Event('residency_updated'));

    try {
      await api.post('/floors', {
        floor_name: floorName,
        floor_number: Number(floorNumber) || 0,
      });
    } catch (e) {
      /* local state active */
    }
  }

  // Structural Management — Delete Floor
  async function deleteFloor(floorId) {
    const updated = floors.filter((f) => f.id !== floorId);
    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    window.dispatchEvent(new Event('residency_updated'));

    try {
      if (floorId && !floorId.startsWith('floor-')) {
        await api.delete(`/floors/${floorId}`);
      }
    } catch (e) {
      /* local state active */
    }
  }

  // Structural Management — Add Room to Floor
  async function addRoom(floorId, roomData) {
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

    const updated = floors.map((f) => {
      if (f.id === floorId) {
        return {
          ...f,
          rooms: [...(f.rooms || []), newRoom],
        };
      }
      return f;
    });

    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    window.dispatchEvent(new Event('residency_updated'));

    try {
      await api.post('/rooms', {
        floor_id: floorId,
        room_number: roomData.room_number,
        category_id: categoryObj.id,
      });
    } catch (e) {
      /* local state active */
    }
  }

  // Structural Management — Delete Room
  async function deleteRoom(floorId, roomId) {
    const updated = floors.map((f) => {
      if (f.id === floorId) {
        return {
          ...f,
          rooms: (f.rooms || []).filter((r) => r.id !== roomId),
        };
      }
      return f;
    });

    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    window.dispatchEvent(new Event('residency_updated'));

    try {
      if (roomId && !roomId.startsWith('r-')) {
        await api.delete(`/rooms/${roomId}`);
      }
    } catch (e) {
      /* local state active */
    }
  }

  // Complete Data Reset — Wipe all bookings, ledgers & restore available rooms
  function resetAllResidencyData() {
    localStorage.removeItem('residency_floors');
    localStorage.removeItem('residency_audit_ledger');
    setFloors(INITIAL_MOCK_FLOORS);
    localStorage.setItem('residency_floors', JSON.stringify(INITIAL_MOCK_FLOORS));
    window.dispatchEvent(new Event('residency_updated'));
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
    resetAllResidencyData,
  };

  return <ResidencyContext.Provider value={value}>{children}</ResidencyContext.Provider>;
}

export function useResidency() {
  const context = useContext(ResidencyContext);
  if (!context) throw new Error('useResidency must be used within ResidencyProvider');
  return context;
}

export default ResidencyContext;
