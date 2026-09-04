import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const ResidencyContext = createContext(null);

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'AC Single', base_price: 1500, max_occupancy: 1 },
  { id: 'cat-2', name: 'AC Double', base_price: 2000, max_occupancy: 2 },
  { id: 'cat-3', name: 'Non-AC Single', base_price: 800, max_occupancy: 1 },
  { id: 'cat-4', name: 'Non-AC Double', base_price: 1200, max_occupancy: 2 },
  { id: 'cat-5', name: 'Deluxe Suite', base_price: 3000, max_occupancy: 3 },
];

const INITIAL_MOCK_FLOORS = [];

// Same-browser cross-tab broadcast channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('residency_sync_channel') : null;

export function ResidencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const universalChannelRef = useRef(null);

  // Load saved floors from localStorage as initial offline fallback
  const [floors, setFloors] = useState(() => {
    const saved = localStorage.getItem('residency_floors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
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

  // Universal multi-device broadcast dispatch
  const broadcastUniversalChange = useCallback(() => {
    // 1. Same-device cross-tab sync
    localStorage.setItem('residency_last_sync', Date.now().toString());
    window.dispatchEvent(new Event('residency_updated'));
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'RESIDENCY_STRUCTURE_UPDATED', timestamp: Date.now() });
      } catch (e) {
        /* ignore */
      }
    }

    // 2. Multi-device worldwide sync via Supabase Realtime WebSocket
    if (universalChannelRef.current) {
      try {
        universalChannelRef.current.send({
          type: 'broadcast',
          event: 'RESIDENCY_STRUCTURE_UPDATED',
          payload: { timestamp: Date.now() },
        });
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
    // 1. Local Cross-Tab Broadcast Channel (Same browser instance)
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
  }, [fetchFloors, fetchCategories]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 2. Global Universal Sync Channel (Multi-Device Worldwide WebSockets)
    const universalChannel = supabase.channel('residency-universal-sync');

    universalChannel
      .on('broadcast', { event: 'RESIDENCY_STRUCTURE_UPDATED' }, () => {
        console.log('🔄 Universal Realtime Sync: received structure update broadcast from another device');
        fetchFloors();
        fetchCategories();
      })
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          universalChannelRef.current = universalChannel;
        }
      });

    return () => {
      universalChannelRef.current = null;
      supabase.removeChannel(universalChannel);
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
      const { data } = await api.post('/floors', {
        floor_name: floorName,
        floor_number: floorNumber !== undefined && floorNumber !== '' ? Number(floorNumber) : undefined,
      });

      // Synchronize canonical database state immediately
      await fetchFloors();

      // Notify all other connected devices universally
      broadcastUniversalChange();

      return data;
    } catch (err) {
      console.error('Failed to create floor on server:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Delete Floor (Universal Server-First Persistence)
  async function deleteFloor(floorId) {
    setLoading(true);
    try {
      const { data } = await api.delete(`/floors/${floorId}`);
      await fetchFloors();
      broadcastUniversalChange();
      return data;
    } catch (err) {
      console.error('Failed to delete floor on server:', err);
      throw err;
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

      const { data } = await api.post('/rooms', {
        floor_id: floorId,
        room_number: String(roomData.room_number),
        category_name: categoryName,
        base_price: basePrice,
        category_id: categoryId,
      });

      // Synchronize canonical database state immediately
      await fetchFloors();

      // Notify all other connected devices universally
      broadcastUniversalChange();

      return data;
    } catch (err) {
      console.error('Failed to create room on server:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Structural Management — Delete Room (Universal Server-First Persistence)
  async function deleteRoom(floorId, roomId) {
    setLoading(true);
    try {
      const { data } = await api.delete(`/rooms/${roomId}`);
      await fetchFloors();
      broadcastUniversalChange();
      return data;
    } catch (err) {
      console.error('Failed to delete room on server:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Mark room occupied (Local optimistic + universal broadcast)
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
      broadcastUniversalChange();
      return updated;
    });
  }

  // Mark room available on checkout (Local optimistic + universal broadcast)
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
      broadcastUniversalChange();
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
