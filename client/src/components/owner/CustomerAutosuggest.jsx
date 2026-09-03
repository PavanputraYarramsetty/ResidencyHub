import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';
import { Search, User, Phone } from 'lucide-react';

export default function CustomerAutosuggest({ value, onChange, onSelect }) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { results, loading } = useCustomerSearch(value);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e) {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
      setIsFocused(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  }

  const showDropdown = isFocused && value?.length >= 2 && (results.length > 0 || loading);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setSelectedIndex(-1); }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-surface-200 shadow-xl overflow-hidden"
          >
            {loading && !results.length ? (
              <div className="p-3 text-sm text-surface-400 text-center">Searching...</div>
            ) : (
              <ul className="max-h-48 overflow-y-auto">
                {results.map((customer, index) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => { onSelect(customer); setIsFocused(false); }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors text-sm ${
                        index === selectedIndex
                          ? 'bg-brand-50 text-brand-700'
                          : 'hover:bg-surface-50 text-surface-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.full_name}</p>
                        <p className="text-xs text-surface-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
