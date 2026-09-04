import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    occupied: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    maintenance: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border shadow-xs ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;

