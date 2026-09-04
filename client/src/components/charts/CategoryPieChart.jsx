import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatINR } from '../../utils/currencyUtils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-xs">
        No category revenue distribution available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={75}
            innerRadius={45}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#161f33',
              borderColor: '#24314c',
              borderRadius: '8px',
              color: '#f9fafb',
              fontSize: '12px',
            }}
            formatter={(val) => [formatINR(val), 'Revenue']}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryPieChart;
