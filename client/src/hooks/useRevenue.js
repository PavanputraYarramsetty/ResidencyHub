import { useState, useEffect, useCallback } from 'react';
import revenueService from '../services/revenueService';

export function useRevenue(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await revenueService.getRevenueSummary(filters);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { data, loading, refetch: fetchRevenue };
}

export default useRevenue;
