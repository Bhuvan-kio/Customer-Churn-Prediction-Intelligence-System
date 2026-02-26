import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import { api } from '../api.js';

export default function FeatureImportance() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.getFeatureImportance()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error)   return <div className="error-box">⚠️ {error}</div>;

  // Take top 12 and format for horizontal bar
  const top = data.features.slice(0, 12).reverse().map(f => ({
    feature: f.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    importance: +f.importance.toFixed(4),
  }));

  // Gradient colors from dim to vivid
  const getColor = (index, total) => {
    const t = index / Math.max(total - 1, 1);
    const r = Math.round(42 + t * (74 - 42));
    const g = Math.round(48 + t * (144 - 48));
    const b = Math.round(64 + t * (217 - 64));
    return `rgb(${r},${g},${b})`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: '#1A1F2E', border: '1px solid #2A3040',
          borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.8rem',
        }}>
          <div style={{ color: '#4A90D9', fontWeight: 700 }}>{payload[0].payload.feature}</div>
          <div style={{ color: '#F0F6FF' }}>Importance: {payload[0].value}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <h1 className="page-title">🔎 Why Are Customers Churning?</h1>
      <p className="page-subtitle">
        Feature importance from Random Forest — the top drivers behind customer attrition.
      </p>

      <div className="chart-card">
        <div className="chart-title">Top 12 Churn Drivers</div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 10 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1E2433" />
            <XAxis
              type="number"
              tick={{ fill: '#8892A0', fontSize: 11 }}
              tickFormatter={v => v.toFixed(3)}
            />
            <YAxis
              type="category"
              dataKey="feature"
              width={200}
              tick={{ fill: '#B0BEC5', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} label={{
              position: 'right', fill: '#8892A0', fontSize: 10,
              formatter: v => v.toFixed(3),
            }}>
              {top.map((_, i) => (
                <Cell key={i} fill={getColor(i, top.length)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-box" style={{ marginTop: '1rem' }}>
        💡 {data.insight}
      </div>
    </>
  );
}
