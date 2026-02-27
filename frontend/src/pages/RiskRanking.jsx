import { useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';

const SORTABLE_COLUMNS = [
  { key: 'customer_id', label: 'ID', type: 'string' },
  { key: 'risk_score', label: 'Severity', type: 'number' },
  { key: 'revenue_estimate', label: 'Revenue ($)', type: 'number' },
  { key: 'geography', label: 'Geography', type: 'string' },
  { key: 'plan_type', label: 'Plan', type: 'string' },
];

function inRevenueRange(value, range) {
  if (range === 'all') return true;
  if (range === 'lt100') return value < 100;
  if (range === '100to500') return value >= 100 && value < 500;
  if (range === '500to1000') return value >= 500 && value < 1000;
  return value >= 1000;
}

export default function RiskRanking({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [captureTop10, setCaptureTop10] = useState(0);

  const [geographyFilter, setGeographyFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [topNPercent, setTopNPercent] = useState(10);
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(null);
    Promise.all([
      api.getRiskRanking(domain),
      api.getModelPerformance(domain),
    ])
      .then(([riskRes, perfRes]) => {
        setData(riskRes);
        setCaptureTop10(Number(perfRes?.capture_rate_top10 ?? 0));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [domain]);

  const allCustomers = data?.customers ?? [];

  const geographyOptions = useMemo(() => {
    const vals = [...new Set(allCustomers.map(c => c.geography || 'Unknown'))];
    return vals.sort((a, b) => String(a).localeCompare(String(b)));
  }, [allCustomers]);

  const filteredRows = useMemo(() => {
    const base = allCustomers.filter(c => {
      const geographyOk = geographyFilter === 'all' || (c.geography || 'Unknown') === geographyFilter;
      const revenueOk = inRevenueRange(Number(c.revenue_estimate || 0), revenueFilter);
      return geographyOk && revenueOk;
    });

    const byRiskDesc = [...base].sort((a, b) => Number(b.risk_score) - Number(a.risk_score));
    const topCount = Math.max(1, Math.ceil((topNPercent / 100) * byRiskDesc.length));
    return byRiskDesc.slice(0, topCount);
  }, [allCustomers, geographyFilter, revenueFilter, topNPercent]);

  const displayedRows = useMemo(() => {
    const colMeta = SORTABLE_COLUMNS.find(c => c.key === sortBy);
    const type = colMeta?.type ?? 'string';
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];
      if (type === 'number') {
        const na = Number(av ?? 0);
        const nb = Number(bv ?? 0);
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      const sa = String(av ?? '').toLowerCase();
      const sb = String(bv ?? '').toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [filteredRows, sortBy, sortDir]);

  const onSort = (key) => {
    if (sortBy === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(key);
    setSortDir(key === 'risk_score' ? 'desc' : 'asc');
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error) return <div className="error-box">⚠️ {error}</div>;

  return (
    <div className="fade-in">
      <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="section-title">High-Risk Customer Segment</h1>
          <p className="section-desc">Tier-1 intelligence targeting the top {topNPercent}% risk-exposed active users.</p>
        </div>
        <button className="btn btn-outline" onClick={() => { }}>Export PDF</button>
      </header>

      {/* Control Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div className="metric-item">
            <span className="metric-label">Geography</span>
            <select className="btn btn-outline" style={{ background: 'transparent', border: 'none', padding: 0 }} value={geographyFilter} onChange={e => setGeographyFilter(e.target.value)}>
              <option value="all">Global (All)</option>
              {geographyOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="metric-item">
            <span className="metric-label">Monthly Revenue</span>
            <select className="btn btn-outline" style={{ background: 'transparent', border: 'none', padding: 0 }} value={revenueFilter} onChange={e => setRevenueFilter(e.target.value)}>
              <option value="all">Enterprise (All)</option>
              <option value="gt1000">T1 (&gt;$1k)</option>
              <option value="500to1000">T2 ($500+)</option>
              <option value="lt100">T3 (&lt;$100)</option>
            </select>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="metric-item" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span className="metric-label">Segmentation Sensitivity</span>
              <span className="metric-status status-emerald">{topNPercent}%</span>
            </div>
            <input
              type="range" min="5" max="100" step="5" value={topNPercent}
              onChange={e => setTopNPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--emerald)' }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: '0 1rem' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                {SORTABLE_COLUMNS.map(col => (
                  <th key={col.key} onClick={() => onSort(col.key)} style={{ cursor: 'pointer' }}>
                    {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th>Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>
                    <span style={{ width: 28, height: 28, background: i < 3 ? 'var(--emerald-glow)' : 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${i < 3 ? 'var(--emerald)' : 'var(--border-glass)'}`, color: i < 3 ? 'var(--emerald)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.customer_id.substring(0, 8)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="bar-container" style={{ width: '80px' }}><div className="bar-fill" style={{ width: `${c.risk_score}%` }}></div></div>
                      <span style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '0.85rem' }}>{c.risk_score}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${c.revenue_estimate.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.geography || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.plan_type || '-'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderColor: 'var(--emerald)', color: 'var(--emerald)' }}>
                      INITIATE RETENTION
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
