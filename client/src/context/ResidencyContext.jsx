import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';


const ResidencyContext = createContext(null);

const MOCK_CATEGORIES = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'AC Single', base_price: 1500, price_per_24_hours: 1500, max_occupancy: 1, max_persons: 1, amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi'] },
  { id: '00000000-0000-0000-0000-000000000102', name: 'AC Double', base_price: 2000, price_per_24_hours: 2000, max_occupancy: 2, max_persons: 2, amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser'] },
  { id: '00000000-0000-0000-0000-000000000103', name: 'AC Triple', base_price: 2500, price_per_24_hours: 2500, max_occupancy: 3, max_persons: 3, amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser'] },
  { id: '00000000-0000-0000-0000-000000000104', name: 'Non-AC Single', base_price: 800, price_per_24_hours: 800, max_occupancy: 1, max_persons: 1, amenities: ['Fan', 'TV', 'Attached Bathroom'] },
  { id: '00000000-0000-0000-0000-000000000105', name: 'Non-AC Double', base_price: 1200, price_per_24_hours: 1200, max_occupancy: 2, max_persons: 2, amenities: ['Fan', 'TV', 'Attached Bathroom'] },
  { id: '00000000-0000-0000-0000-000000000106', name: 'Non-AC Triple', base_price: 1600, price_per_24_hours: 1600, max_occupancy: 3, max_persons: 3, amenities: ['Fan', 'TV', 'Attached Bathroom'] },
  { id: '00000000-0000-0000-0000-000000000107', name: 'Deluxe Suite', base_price: 3500, price_per_24_hours: 3500, max_occupancy: 4, max_persons: 4, amenities: ['AC', 'Smart TV', 'Bathtub', 'High-speed WiFi', 'Mini Fridge', 'Room Service'] },
];


const INITIAL_MOCK_FLOORS = [];

// Same-browser cross-tab broadcast channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('residency_sync_channel') : null;

export function ResidencyProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [floors, setFloors] = useState(() => {
    const saved = localStorage.getItem('residency_floors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Fetch canonical floors and room inventory from backend API
  const fetchFloors = useCallback(async () => {
    try {
      const { data } = await api.get('/floors');
      if (Array.isArray(data)) {
        setFloors(data);
        localStorage.setItem('residency_floors', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Fetch floors notice — keeping local cache:', err.message);
    }
  }, []);

  // Fetch canonical room categories from backend API
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms/categories');
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      /* ignore */
    }
  }, []);

  // Cross-tab broadcast dispatch
  const broadcastUniversalChange = useCallback(() => {
    // Same-device cross-tab sync
    localStorage.setItem('residency_last_sync', Date.now().toString());
    window.dispatchEvent(new Event('residency_updated'));
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'RESIDENCY_STRUCTURE_UPDATED', timestamp: Date.now() });
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  // Always fetch fresh data on initial mount and when authenticated
  useEffect(() => {
    fetchFloors();
    fetchCategories();
  }, [fetchFloors, fetchCategories]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFloors();
      fetchCategories();
    }
  }, [isAuthenticated, fetchFloors, fetchCategories]);

  // Realtime & Cross-Device Sync Listeners
  useEffect(() => {
    // 1. Supabase Global Realtime Broadcast Subscription (Multi-device, anywhere in the world)
    let realtimeChannel = null;
    if (isSupabaseConfigured && supabase) {
      try {
        realtimeChannel = supabase
          .channel('public:residency_live_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
            fetchFloors();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
            fetchFloors();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'floors' }, () => {
            fetchFloors();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'room_categories' }, () => {
            fetchCategories();
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime init notice:', err);
      }
    }

    // 2. Local Cross-Tab Broadcast Channel (Same browser instance)
    if (syncChannel) {
      const handleBroadcast = (event) => {
        if (event.data?.type === 'RESIDENCY_STRUCTURE_UPDATED') {
          fetchFloors();
          fetchCategories();
        }
      };
      syncChannel.addEventListener('message', handleBroadcast);
      return () => {
        syncChannel.removeEventListener('message', handleBroadcast);
        if (realtimeChannel) supabase?.removeChannel(realtimeChannel);
      };
    }

    return () => {
      if (realtimeChannel) supabase?.removeChannel(realtimeChannel);
    };
  }, [fetchFloors, fetchCategories]);


  // 3. Multi-Device Polling & Window Focus Sync (Guarantees fresh sync across all screens)
  useEffect(() => {
    const handleFocus = () => {
      fetchFloors();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic 10-second sync while tab is open
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFloors();
      }
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchFloors]);

  // 4. Local storage & custom events
  useEffect(() => {
    function handleSync() {
      fetchFloors();
    }

    window.addEventListener('storage', handleSync);
    window.addEventListener('residency_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('residency_updated', handleSync);
    };
  }, [fetchFloors]);

  // Structural Management — Add Floor (Universal Server-First Persistence)
  async function addFloor(floorName, floorNumber) {
    setLoading(true);
    try {
      const num = floorNumber !== undefined && floorNumber !== '' ? Number(floorNumber) : floors.length;
      let data = null;
      try {
        const res = await api.post('/floors', {
          floor_name: floorName,
          floor_number: num,
        });
        data = res.data;
      } catch (err) {
        console.warn('Backend add floor API notice:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create floor');
      }

      // Optimistically update local state immediately
      setFloors((prevFloors) => {
        const exists = prevFloors.some((f) => f.id === data?.id || f.floor_name === floorName);
        if (!exists) {
          const newFloorObj = data || {
            id: `floor-${num}`,
            floor_name: floorName,
            floor_number: num,
            rooms: [],
          };
          const updated = [...prevFloors, newFloorObj].sort((a, b) => a.floor_number - b.floor_number);
          localStorage.setItem('residency_floors', JSON.stringify(updated));
          return updated;
        }
        return prevFloors;
      });

      // Synchronize canonical database state immediately
      fetchFloors().catch(() => {});

      // Notify all other connected devices universally
      broadcastUniversalChange();

      return data;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Delete Floor (Universal Server-First Persistence)
  async function deleteFloor(floorId) {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await api.delete(`/floors/${floorId}`);
        data = res.data;
      } catch (err) {
        console.warn('Backend delete floor notice:', err.response?.data || err.message);
        if (err.response?.status !== 404 && !String(floorId).startsWith('floor-')) {
          throw err;
        }
      }

      setFloors((prevFloors) => {
        const updated = prevFloors.filter((f) => f.id !== floorId && f.floor_number !== floorId);
        localStorage.setItem('residency_floors', JSON.stringify(updated));
        return updated;
      });

      await fetchFloors();
      broadcastUniversalChange();
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Update Floor
  async function updateFloor(floorId, updates) {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await api.put(`/floors/${floorId}`, updates);
        data = res.data;
      } catch (err) {
        console.warn('Backend update floor notice:', err.response?.data || err.message);
      }

      setFloors((prevFloors) => {
        const updated = prevFloors.map((floor) => {
          if (floor.id === floorId || String(floor.floor_number) === String(floorId)) {
            return { ...floor, ...updates };
          }
          return floor;
        });
        localStorage.setItem('residency_floors', JSON.stringify(updated));
        return updated;
      });

      fetchFloors().catch(() => {});
      broadcastUniversalChange();
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Add Room to Floor (Universal Server-First Persistence)
  async function addRoom(floorId, roomData) {
    setLoading(true);
    try {
      const categoryName = roomData.category?.name || roomData.category_name || 'Standard';
      const basePrice = Number(roomData.category?.base_price || roomData.base_price) || 1500;
      const categoryId = roomData.category?.id || roomData.category_id;
      const roomNum = String(roomData.room_number).trim();

      let data = null;
      try {
        const res = await api.post('/rooms', {
          floor_id: floorId,
          room_number: roomNum,
          category_name: categoryName,
          base_price: basePrice,
          category_id: categoryId,
        });
        data = res.data;
      } catch (err) {
        console.warn('Backend add room API notice:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create room');
      }

      // Optimistically add room to local state
      setFloors((prevFloors) => {
        const updated = prevFloors.map((floor) => {
          if (floor.id === floorId || String(floor.floor_number) === String(floorId) || `floor-${floor.floor_number}` === String(floorId)) {
            const existingRooms = floor.rooms || [];
            const exists = existingRooms.some((r) => String(r.room_number) === roomNum);
            if (!exists) {
              const newRoomObj = data || {
                id: `r-${roomNum}`,
                room_number: roomNum,
                status: 'available',
                floor_id: floor.id,
                room_categories: {
                  name: categoryName,
                  base_price: basePrice,
                },
              };
              return { ...floor, rooms: [...existingRooms, newRoomObj] };
            }
          }
          return floor;
        });
        localStorage.setItem('residency_floors', JSON.stringify(updated));
        return updated;
      });

      // Synchronize canonical database state immediately
      fetchFloors().catch(() => {});

      // Notify all other connected devices universally
      broadcastUniversalChange();

      return data;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Update Room
  async function updateRoom(roomId, updates) {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await api.put(`/rooms/${roomId}`, updates);
        data = res.data;
      } catch (err) {
        console.warn('Backend update room notice:', err.response?.data || err.message);
      }

      setFloors((prevFloors) => {
        const updated = prevFloors.map((floor) => ({
          ...floor,
          rooms: (floor.rooms || []).map((room) => {
            const matches =
              room.id === roomId ||
              String(room.room_number) === String(roomId) ||
              String(room.room_number) === String(roomId).replace(/^r-/, '');
            if (matches) {
              return { ...room, ...updates };
            }
            return room;
          }),
        }));
        localStorage.setItem('residency_floors', JSON.stringify(updated));
        return updated;
      });

      fetchFloors().catch(() => {});
      broadcastUniversalChange();
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Delete Room (Universal Server-First Persistence)
  async function deleteRoom(floorId, roomId) {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await api.delete(`/rooms/${roomId}`);
        data = res.data;
      } catch (err) {
        console.warn('Backend delete room notice:', err.response?.data || err.message);
        if (err.response?.status !== 404 && !String(roomId).startsWith('r-')) {
          throw err;
        }
      }

      // Optimistically remove from local state immediately
      setFloors((prevFloors) => {
        const updated = prevFloors.map((floor) => ({
          ...floor,
          rooms: (floor.rooms || []).filter(
            (r) => r.id !== roomId && String(r.room_number) !== String(roomId) && `r-${r.room_number}` !== String(roomId)
          ),
        }));
        localStorage.setItem('residency_floors', JSON.stringify(updated));
        return updated;
      });

      await fetchFloors();
      broadcastUniversalChange();
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Mark room occupied (Local optimistic + universal broadcast)
  function markRoomOccupied(roomId, bookingData = {}) {
    const rawTarget = String(roomId || bookingData?.room_number || '').replace(/^r-/, '');
    const cleanTarget = rawTarget.replace(/^0+/, '');

    setFloors((prevFloors) => {
      const updated = prevFloors.map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => {
          const roomNumStr = String(room.room_number || '').replace(/^r-/, '');
          const cleanRoomNo = roomNumStr.replace(/^0+/, '');
          const matchesRoom =
            (roomId && room.id === roomId) ||
            (rawTarget && roomNumStr === rawTarget) ||
            (cleanTarget && cleanRoomNo === cleanTarget);

          if (matchesRoom) {
            const dailyRate = Number(bookingData.rate_per_day || room.room_categories?.base_price || 1000);
            const days = Number(bookingData.no_of_days || 1);
            const advance = Number(bookingData.advance_amount || 0);
            return {
              ...room,
              status: 'occupied',
              active_booking: {
                id: `bk-${Date.now()}`,
                customers: {
                  full_name: bookingData.full_name || 'Guest',
                  phone: bookingData.phone || '—',
                  age: bookingData.age || null,
                  gender: bookingData.gender || 'Male',
                  aadhar_number: bookingData.aadhar_number || '',
                  address: bookingData.address || '',
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
      broadcastUniversalChange();
      return updated;
    });

    // In background, refresh from server to ensure database sync
    fetchFloors().catch(() => {});
  }

  // Mark room available on checkout (Local optimistic + universal broadcast)
  function markRoomAvailable(roomId, checkoutSummary = {}) {
    const rawTarget = String(checkoutSummary?.roomNumber || checkoutSummary?.room_number || roomId || '').replace(/^r-/, '');
    const cleanTarget = rawTarget.replace(/^0+/, '');
    const targetParsed = parseInt(rawTarget, 10);

    setFloors((prevFloors) => {
      let matchedAny = false;
      const updated = prevFloors.map((floor) => ({
        ...floor,
        rooms: (floor.rooms || []).map((room) => {
          const roomNumStr = String(room.room_number || '').replace(/^r-/, '');
          const cleanRoomNo = roomNumStr.replace(/^0+/, '');
          const roomParsed = parseInt(roomNumStr, 10);

          const matchesRoom =
            (roomId && room.id === roomId) ||
            (checkoutSummary?.bookingId && room.active_booking?.id === checkoutSummary.bookingId) ||
            (rawTarget && roomNumStr === rawTarget) ||
            (cleanTarget && cleanRoomNo === cleanTarget) ||
            (rawTarget && roomNumStr.padStart(2, '0') === rawTarget.padStart(2, '0')) ||
            (!isNaN(targetParsed) && !isNaN(roomParsed) && targetParsed === roomParsed) ||
            (roomId && roomNumStr === String(roomId).replace(/^r-/, '')) ||
            (room.status === 'occupied');

          if (matchesRoom) {
            matchedAny = true;
            return {
              ...room,
              status: 'available',
              active_booking: null,
            };
          }
          return room;
        }),
      }));

      // Fallback: If no specific match, mark ALL occupied rooms available
      const finalFloors = matchedAny
        ? updated
        : updated.map((floor) => ({
            ...floor,
            rooms: (floor.rooms || []).map((room) =>
              room.status === 'occupied'
                ? { ...room, status: 'available', active_booking: null }
                : room
            ),
          }));

      localStorage.setItem('residency_floors', JSON.stringify(finalFloors));
      broadcastUniversalChange();
      return finalFloors;
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

    // In background, refresh from server to ensure database sync
    fetchFloors().catch(() => {});
  }

  // Complete Data Reset — Wipe all bookings, ledgers & restore available rooms
  async function resetAllResidencyData() {
    localStorage.removeItem('residency_floors');
    localStorage.removeItem('residency_audit_ledger');
    setFloors(INITIAL_MOCK_FLOORS);
    broadcastUniversalChange();
    try {
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
    updateFloor,
    deleteFloor,
    addRoom,
    updateRoom,
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
