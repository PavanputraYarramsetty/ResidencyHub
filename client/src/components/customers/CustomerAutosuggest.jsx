import React, { useState, useEffect, useRef } from 'react';
import customerService from '../../services/customerService';
import { User, Phone, History, Sparkles } from 'lucide-react';

export function CustomerAutosuggest({ value, onChange, onSelectCustomer }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await customerService.searchCustomers(value);
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
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Customer Name or Phone..."
        className="w-full bg-[#161f33] border border-[#24314c] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all"
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#121929] border border-[#24314c] rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 bg-[#161f33] border-b border-[#1f293d] flex items-center justify-between text-[11px] font-semibold text-blue-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Previous Customers Detected
            </span>
            <span className="text-[10px] text-gray-400">Click to Auto-fill</span>
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
                className="w-full text-left p-2.5 rounded-lg hover:bg-blue-600/15 hover:border-blue-500/30 border border-transparent transition-all flex items-start justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-gray-100 group-hover:text-blue-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    {cust.full_name}
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                    <Phone className="w-3 h-3 text-gray-500" />
                    {cust.phone}
                  </p>
                  {cust.address && <p className="text-[10px] text-gray-500 truncate max-w-[220px]">{cust.address}</p>}
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <History className="w-2.5 h-2.5" />
                    Returning Guest
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
