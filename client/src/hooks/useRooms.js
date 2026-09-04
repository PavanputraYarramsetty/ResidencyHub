import { useState, useEffect, useCallback } from 'react';
import roomService from '../services/roomService';
import floorService from '../services/floorService';

export function useRooms() {
  const [floors, setFloors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [floorsData, categoriesData] = await Promise.all([
        floorService.getFloors(),
        roomService.getCategories(),
      ]);
      setFloors(floorsData || []);
      setCategories(categoriesData || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { floors, categories, loading, error, refetch: fetchData };
}

export default useRooms;
