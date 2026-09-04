import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatINR } from '../../utils/currencyUtils';

export function OccupancyBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-xs">
        No floor revenue statistics available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
          <XAxis dataKey="floor" stroke="#6b7280" fontSize={11} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161f33',
              borderColor: '#24314c',
              borderRadius: '8px',
              color: '#f9fafb',
              fontSize: '12px',
            }}
            formatter={(val) => [formatINR(val), 'Floor Revenue']}
          />
          <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default OccupancyBarChart;
