import { useState, useEffect, useCallback } from 'react';
import bookingService from '../services/bookingService';

export function useBookings(filters = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings(filters);
      setBookings(res.bookings || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, total, refetch: fetchBookings };
}

export default useBookings;
