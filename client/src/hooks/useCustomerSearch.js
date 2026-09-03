import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Debounced customer search hook for autosuggest
 */
export function useCustomerSearch(query, delay = 300) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(`/customers/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (err) {
      console.error('Customer search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay, search]);

  return { results, loading };
}
