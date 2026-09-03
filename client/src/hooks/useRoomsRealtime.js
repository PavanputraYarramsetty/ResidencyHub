import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../services/api';

/**
 * Real-time room status subscription
 * Listens to rooms + bookings table changes via Supabase Realtime
 */
export function useRoomsRealtime(floorId) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!floorId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/rooms?floor_id=${floorId}`);
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [floorId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Subscribe to real-time changes on rooms table
  useEffect(() => {
    const channel = supabase
      .channel('room-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
      }, (payload) => {
        setRooms(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(r => r.id === payload.new?.id);
          if (idx >= 0 && payload.new) {
            updated[idx] = { ...updated[idx], ...payload.new };
          }
          return updated;
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
      }, () => {
        // Refetch rooms when any booking changes (to update status)
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  return { rooms, loading, refetch: fetchRooms };
}
