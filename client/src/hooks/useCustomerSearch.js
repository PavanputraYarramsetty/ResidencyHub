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
      const queryLower = q.toLowerCase();

      // 1. Search local guests from bookings, audit ledger, and local storage
      const localFloors = JSON.parse(localStorage.getItem('residency_floors') || '[]');
      const auditLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      
      const localMatchMap = new Map();

      localFloors.forEach((f) => {
        (f.rooms || []).forEach((r) => {
          const c = r.active_booking?.customers;
          if (c?.full_name || c?.phone) {
            const matchName = c.full_name?.toLowerCase().includes(queryLower);
            const matchPhone = c.phone?.includes(q);
            if (matchName || matchPhone) {
              localMatchMap.set(c.phone || c.full_name, c);
            }
          }
        });
      });

      auditLedger.forEach((log) => {
        const c = log.customers;
        if (c?.full_name || c?.phone) {
          const matchName = c.full_name?.toLowerCase().includes(queryLower);
          const matchPhone = c.phone?.includes(q);
          if (matchName || matchPhone) {
            localMatchMap.set(c.phone || c.full_name, c);
          }
        }
      });

      // 2. Search backend API
      let remoteMatches = [];
      try {
        const { data } = await api.get(`/customers/search?q=${encodeURIComponent(q)}`);
        remoteMatches = Array.isArray(data) ? data : [];
      } catch (e) {
        /* fallback to local */
      }

      remoteMatches.forEach((c) => {
        localMatchMap.set(c.phone || c.full_name, c);
      });

      setResults(Array.from(localMatchMap.values()));
    } catch (err) {
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
