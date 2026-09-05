import React, { useState, useEffect, useRef } from 'react';
import customerService from '../../services/customerService';
import { User, Phone, History, Sparkles, MapPin } from 'lucide-react';

export function CustomerAutosuggest({ value, onChange, onSelectCustomer }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchSuggestions = async (searchTerm) => {
    try {
      setLoading(true);
      const data = await customerService.searchCustomers(searchTerm || '');
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);

    return () => clearTimeout(timer);
  }, [value]);

  function handleFocus() {
    fetchSuggestions(value);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onFocus={handleFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter or search guest name / phone..."
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs font-['Inter']"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 font-['Inter']">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-blue-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Registered Returning Guests ({suggestions.length})
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Tap guest to auto-fill</span>
          </div>

          <div className="p-1 space-y-1">
            {suggestions.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => {
                  onSelectCustomer(cust);
                  setIsOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50/80 hover:border-blue-200 border border-transparent transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 font-['Plus_Jakarta_Sans']">
                    {cust.full_name?.charAt(0) || 'G'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                      {cust.full_name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone}
                      </span>
                      {cust.address && (
                        <span className="truncate max-w-[140px] text-slate-400 flex items-center gap-0.5">
                          • <MapPin className="w-2.5 h-2.5 inline" /> {cust.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <History className="w-3 h-3" />
                    Auto-Fill
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerAutosuggest;
