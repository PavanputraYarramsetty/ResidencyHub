import React from 'react';

export function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-[#1e2942]/60 rounded-lg ${className}`}
        />
      ))}
    </>
  );
}

export default SkeletonLoader;
