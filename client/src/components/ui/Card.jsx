import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs ${
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

