import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';

export function useCustomers(initialSearch = '') {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [total, setTotal] = useState(0);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({ search });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, search, setSearch, total, refetch: fetchCustomers };
}

export default useCustomers;
