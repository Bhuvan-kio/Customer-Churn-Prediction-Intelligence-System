import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export default function ROISimulator({ domain }) {
  const [avgRev, setAvgRev] = useState(500);
  const [offerCost, setOfferCost] = useState(50);
  const [churnRed, setChurnRed] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const simulate = useCallback(() => {
    setLoading(true);
    setError(null);
    api.roiSimulation({ avg_revenue: avgRev, offer_cost: offerCost, churn_reduction_pct: churnRed }, domain)
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [avgRev, offerCost, churnRed, domain]);

  useEffect(() => { setResult(null); simulate(); }, [domain]);

  return (
    <div className="fade-in">
      <header className="section-header">
        <h1 className="section-title">Portfolio Optimization Engine</h1>
        <p className="section-desc">Simulate algorithmic retention ROI by adjusting cost-benefit vectors and target sensitivity.</p>
      </header>

      <div className="engine-grid">
        {/* Control Panel */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 className="metric-label" style={{ marginBottom: '2rem' }}>Simulation Parameters</h3>

          <div className="metric-item" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="metric-label">Average Unit Revenue</span>
              <span className="metric-status status-emerald">${avgRev}</span>
            </div>
            <input type="range" min="100" max="2000" step="50" value={avgRev} onChange={e => setAvgRev(+e.target.value)} style={{ width: '100%', accentColor: 'var(--emerald)' }} />
          </div>

          <div className="metric-item" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="metric-label">Retention Vector Cost</span>
              <span className="metric-status status-gold">${offerCost}</span>
            </div>
            <input type="range" min="10" max="200" step="10" value={offerCost} onChange={e => setOfferCost(+e.target.value)} style={{ width: '100%', accentColor: 'var(--gold)' }} />
          </div>

          <div className="metric-item" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="metric-label">Target Efficiency (%)</span>
              <span className="metric-status status-emerald">{churnRed}%</span>
            </div>
            <input type="range" min="5" max="80" step="5" value={churnRed} onChange={e => setChurnRed(+e.target.value)} style={{ width: '100%', accentColor: 'var(--emerald)' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={simulate} disabled={loading}>
            {loading ? 'Recalculating...' : 'Run Optimization Vector'}
          </button>
        </div>

        {/* Results Display */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {result ? (
            <>
              <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--emerald)' }}>
                <span className="metric-label">Net Projected Profit</span>
                <div className="metric-value status-emerald">${result.net_profit.toLocaleString()}</div>
                <div className="metric-status status-emerald">Positive Arbitrage</div>
              </div>
              <div className="metrics-row" style={{ gap: '1.5rem' }}>
                <div className="glass-card metric-card" style={{ flex: 1 }}>
                  <span className="metric-label">Saved Revenue</span>
                  <div className="metric-value" style={{ fontSize: '1.4rem' }}>${result.revenue_saved.toLocaleString()}</div>
                </div>
                <div className="glass-card metric-card" style={{ flex: 1 }}>
                  <span className="metric-label">Campaign Cost</span>
                  <div className="metric-value" style={{ fontSize: '1.4rem' }}>${result.offer_cost.toLocaleString()}</div>
                </div>
              </div>
              <div className="glass-card metric-card">
                <span className="metric-label">Portfolio ROI</span>
                <div className="metric-value status-emerald">{result.roi_percent.toFixed(0)}%</div>
                <div className="metric-status status-emerald">High Performance</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="metric-label">Customers Rescued</span>
                  <span style={{ fontWeight: 800, color: 'var(--emerald)' }}>{result.churners_saved.toFixed(0)}</span>
                </div>
                <div className="bar-container" style={{ height: '8px' }}>
                  <div className="bar-fill" style={{ width: `${(result.churners_saved / result.customers_targeted * 100).toFixed(0)}%` }}></div>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
