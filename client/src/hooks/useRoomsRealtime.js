import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook for fetching and managing rooms with auto-polling
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

  return { rooms, loading, refetch: fetchRooms };
}
