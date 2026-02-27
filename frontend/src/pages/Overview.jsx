import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../api.js';

export default function Overview({ navigate, domain }) {
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setKpis(null);
    setAnalytics(null);
    Promise.all([api.getKpis(domain), api.getOverviewAnalytics(domain)])
      .then(([k, a]) => {
        setKpis(k);
        setAnalytics(a);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error) return <div className="error-box">⚠️ {error}</div>;

  const donutColors = ['#475569', '#10b981'];
  const segColors = ['#10b981', '#f59e0b', '#3b82f6'];

  const imbalanceBarData = analytics.class_imbalance.distribution.map(d => ({
    segment: d.name,
    customers: d.count,
  }));

  return (
    <div className="fade-in">
      <header className="section-header">
        <h1 className="section-title">Churn Risk Engine <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>v4.0</span></h1>
        <p className="section-desc">Multi-algorithm predictive suite with advanced data sanitization and domain-specific risk assessment.</p>
      </header>

      {/* Main KPI Row */}
      <div className="metrics-row">
        <div className="glass-card metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Total Analyzed Assets</span>
            <span className="metric-icon">👥</span>
          </div>
          <div className="metric-value">{kpis.total_customers.toLocaleString()}</div>
          <div className="metric-status status-emerald">✓ Dataset Verified</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Avg. Churn Propensity</span>
            <span className="metric-icon">📉</span>
          </div>
          <div className="metric-value">{kpis.churn_rate}%</div>
          <div className="metric-status status-gold">⚡ Review Recommended</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Model Confidence Score</span>
            <span className="metric-icon">🎯</span>
          </div>
          <div className="metric-value">{(kpis.model_auc * 100).toFixed(1)}%</div>
          <div className="metric-status status-emerald">✓ {kpis.best_model} Active</div>
        </div>
      </div>

      {/* Data Health & Imbalance */}
      <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Intelligence Diagnostics</h2>
      <div className="engine-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-card">
          <h3 className="metric-label" style={{ marginBottom: '1.5rem' }}>Data Integrity Manifest</h3>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="metric-item">
              <div className="metric-label">Missing Data Points</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="bar-container"><div className="bar-fill" style={{ width: `${analytics.data_health.missing_values_pct}%` }}></div></div>
                <span className="metric-status">{analytics.data_health.missing_values_pct}%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Duplicate Registry Entries</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="bar-container"><div className="bar-fill gold" style={{ width: `${Math.min(100, analytics.data_health.duplicate_records_pct * 10)}%` }}></div></div>
                <span className="metric-status">{analytics.data_health.duplicate_records_pct}%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">System Architecture Shape</div>
              <div className="metric-status status-emerald" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {analytics.data_health.rows.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nodes</span> × {analytics.data_health.columns} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vectors</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="metric-label" style={{ marginBottom: '1.5rem' }}>Class Distribution Matrix</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.class_imbalance.distribution}
                  dataKey="count"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {analytics.class_imbalance.distribution.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} stroke="rgba(255,255,255,0.1)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span className="metric-status status-emerald" style={{ fontSize: '0.9rem' }}>
              Churn Capture Ratio: <span style={{ color: '#fff' }}>{analytics.class_imbalance.ratio}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Segmentation Snapshots */}
      <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Risk Vector Analytics</h2>
      <div className="metrics-row">
        {analytics.segmentations.map((seg, idx) => (
          <div key={seg.title} className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="metric-label" style={{ marginBottom: '1.5rem' }}>{seg.title}</div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seg.rows}>
                  <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="churn_rate" fill={segColors[idx % segColors.length]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
