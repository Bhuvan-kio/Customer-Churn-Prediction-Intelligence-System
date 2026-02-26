import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function RiskRanking() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.getRiskRanking()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error)   return <div className="error-box">⚠️ {error}</div>;

  return (
    <>
      <h1 className="page-title">🎯 High-Risk Customer Segment</h1>
      <p className="page-subtitle">
        Top 10% customers ranked by churn probability — with actionable retention strategies.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Risk</th>
              <th style={{ minWidth: 140 }}>Risk Score</th>
              <th>Churn Prob</th>
              <th>Monthly Rev ($)</th>
              <th>Balance ($)</th>
              <th style={{ minWidth: 280 }}>Suggested Action</th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {c.customer_id}
                </td>
                <td>
                  <span className={`badge badge-${c.risk_band.toLowerCase()}`}>
                    {c.risk_band === 'High' ? '🔴' : '🟠'} {c.risk_band}
                  </span>
                </td>
                <td>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${c.risk_score}%`,
                          background: c.risk_band === 'High'
                            ? 'linear-gradient(90deg, #FF6B6B, #cc4444)'
                            : 'linear-gradient(90deg, #FFA94D, #cc7722)',
                        }}
                      />
                    </div>
                    <span className="progress-label">{c.risk_score}</span>
                  </div>
                </td>
                <td style={{ color: c.churn_probability >= 0.6 ? 'var(--red)' : 'var(--orange)', fontWeight: 700 }}>
                  {(c.churn_probability * 100).toFixed(1)}%
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  ${c.revenue_estimate.toFixed(2)}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  ${c.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ color: 'var(--text-muted)', maxWidth: 280, whiteSpace: 'normal', lineHeight: 1.4 }}>
                  {c.suggested_action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.6rem' }}>
        Showing {data.customers.length} of {data.total_in_segment} high-risk customers in segment.
      </p>
    </>
  );
}
