import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { formatCurrency } from '../../utils/dateFormat';

export function RevenueBarChart({ data }) {
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(value) => [formatCurrency(value), 'Revenue']}
        />
        <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4263eb" />
            <stop offset="100%" stopColor="#748ffc" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueLineChart({ data }) {
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4263eb" strokeWidth={2} dot={{ fill: '#4263eb', r: 4 }} name="Revenue" />
        <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Bookings" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }) {
  if (!data?.length) return <EmptyChart />;

  const colors = ['#4263eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(v) => [formatCurrency(v), 'Revenue']} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Bar key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-64 text-surface-400 text-sm">
      No data available for the selected period
    </div>
  );
}
