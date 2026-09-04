import React from 'react';

export function BrandIcon({ className = "w-9 h-9" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#1D4ED8"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#blueGrad)"/>
      <path d="M14 36V18L24 10L34 18V36H14Z" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="20" y="22" width="8" height="6" rx="1.5" fill="#93C5FD"/>
      <path d="M24 28V36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="16" r="2" fill="#FFFFFF"/>
    </svg>
  );
}

export default BrandIcon;
