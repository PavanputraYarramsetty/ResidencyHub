import React from 'react';

export function Input({ label, error, helperText, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
        } rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
}

export default Input;
