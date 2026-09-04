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

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('residency_sync_channel') : null;

function notifyStructureChange() {
  localStorage.setItem('residency_last_sync', Date.now().toString());
  window.dispatchEvent(new Event('residency_updated'));
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'RESIDENCY_STRUCTURE_UPDATED', timestamp: Date.now() });
    } catch (e) {
      /* ignore */
    }
  }
}

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

  // Realtime & Cross-Tab Listeners
  useEffect(() => {
    // 1. Cross-Tab Broadcast Channel (Owner <-> Admin tabs)
    if (syncChannel) {
      const handleBroadcast = (event) => {
        if (event.data?.type === 'RESIDENCY_STRUCTURE_UPDATED') {
          fetchFloors();
          fetchCategories();
        }
      };
      syncChannel.addEventListener('message', handleBroadcast);
      return () => syncChannel.removeEventListener('message', handleBroadcast);
    }
  }, []);

  // 2. Supabase Realtime multi-device sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('residency-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'floors' }, () => {
        fetchFloors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchFloors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_categories' }, () => {
        fetchFloors();
        fetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchFloors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Window focus refresh
  useEffect(() => {
    const handleFocus = () => {
      fetchFloors();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 4. Local storage & custom events
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

  async function fetchFloors() {
    try {
      setLoading(true);
      const { data } = await api.get('/floors');
      if (Array.isArray(data)) {
        // Merge with local overrides if room was marked occupied/available locally
        const saved = localStorage.getItem('residency_floors');
        let statusMap = new Map();
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            parsed.forEach((pf) => {
              (pf.rooms || []).forEach((pr) => {
                statusMap.set(pr.id, { status: pr.status, active_booking: pr.active_booking });
                statusMap.set(String(pr.room_number), { status: pr.status, active_booking: pr.active_booking });
              });
            });
          } catch (e) {
            /* ignore */
          }
        }

        const mergedFloors = data.map((f) => ({
          ...f,
          rooms: (f.rooms || []).map((r) => {
            const override = statusMap.get(r.id) || statusMap.get(String(r.room_number));
            if (override && (r.status === 'available' || !r.active_booking)) {
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
        localStorage.setItem('residency_floors', JSON.stringify(mergedFloors));
      }
    } catch (err) {
      console.warn('Fetch floors notice — keeping local cache:', err.message);
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
      notifyStructureChange();
      return updated;
    });
  }

  // Mark room available on checkout
  function markRoomAvailable(roomId, checkoutSummary) {
    setFloors((prevFloors) => {
      const updated = prevFloors.map((floor) => ({
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
      }));
      localStorage.setItem('residency_floors', JSON.stringify(updated));
      notifyStructureChange();
      return updated;
    });

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
  async function addFloor(floorName, floorNumber) {
    const tempFloorId = `floor-${Date.now()}`;
    const newFloor = {
      id: tempFloorId,
      floor_number: Number(floorNumber) || floors.length,
      floor_name: floorName || `Floor ${floors.length + 1}`,
      stats: { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, reservedRooms: 0 },
      rooms: [],
    };

    const updated = [...floors, newFloor];
    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    notifyStructureChange();

    try {
      const { data } = await api.post('/floors', {
        floor_name: floorName,
        floor_number: Number(floorNumber) || 0,
      });

      if (data && data.id) {
        setFloors((prevFloors) => {
          const synced = prevFloors.map((f) => {
            if (f.id === tempFloorId || f.floor_number === data.floor_number) {
              return { ...f, ...data, rooms: f.rooms || data.rooms || [] };
            }
            return f;
          });
          localStorage.setItem('residency_floors', JSON.stringify(synced));
          return synced;
        });
        notifyStructureChange();
      }
      return data;
    } catch (e) {
      console.warn('Backend addFloor notice — local floor kept:', e.message);
      return newFloor;
    }
  }

  // Structural Management — Delete Floor
  async function deleteFloor(floorId) {
    const updated = floors.filter((f) => f.id !== floorId);
    setFloors(updated);
    localStorage.setItem('residency_floors', JSON.stringify(updated));
    notifyStructureChange();

    try {
      if (floorId && !floorId.startsWith('floor-')) {
        await api.delete(`/floors/${floorId}`);
      }
      notifyStructureChange();
    } catch (e) {
      console.warn('Backend deleteFloor notice:', e.message);
    }
  }

  // Structural Management — Add Room to Floor
  async function addRoom(floorId, roomData) {
    const categoryObj = roomData.category || {
      id: roomData.category_id || 'cat-1',
      name: roomData.category_name || 'AC Single',
      base_price: Number(roomData.base_price) || 1500,
    };

    const tempRoomId = `r-${Date.now()}`;
    const newRoom = {
      id: tempRoomId,
      floor_id: floorId,
      room_number: String(roomData.room_number),
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
    notifyStructureChange();

    try {
      const { data } = await api.post('/rooms', {
        floor_id: floorId,
        room_number: roomData.room_number,
        category_id: categoryObj.id,
        category_name: categoryObj.name,
        base_price: categoryObj.base_price,
      });

      if (data && data.id) {
        setFloors((prevFloors) => {
          const synced = prevFloors.map((f) => {
            if (f.id === floorId || f.id === data.floor_id) {
              const updatedRooms = (f.rooms || []).map((r) => {
                if (r.id === tempRoomId || String(r.room_number) === String(data.room_number)) {
                  return { ...r, ...data };
                }
                return r;
              });
              return { ...f, rooms: updatedRooms };
            }
            return f;
          });
          localStorage.setItem('residency_floors', JSON.stringify(synced));
          return synced;
        });
        notifyStructureChange();
      }
      return data;
    } catch (e) {
      console.warn('Backend addRoom notice — local room kept:', e.message);
      return newRoom;
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
    notifyStructureChange();

    try {
      if (roomId && !roomId.startsWith('r-')) {
        await api.delete(`/rooms/${roomId}`);
      }
      notifyStructureChange();
    } catch (e) {
      console.warn('Backend deleteRoom notice:', e.message);
    }
  }

  // Complete Data Reset — Wipe all bookings, ledgers & restore available rooms
  async function resetAllResidencyData() {
    localStorage.removeItem('residency_floors');
    localStorage.removeItem('residency_audit_ledger');
    setFloors(INITIAL_MOCK_FLOORS);
    localStorage.setItem('residency_floors', JSON.stringify(INITIAL_MOCK_FLOORS));
    notifyStructureChange();
    try {
      // Fetch latest clean structure from server
      await fetchFloors();
    } catch (e) {
      /* ignore */
    }
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
