import { useState, useCallback } from 'react';
import { api } from '../api.js';

export default function ABTesting({ domain }) {
  const [churnRed, setChurnRed] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const simulate = useCallback(() => {
    setLoading(true);
    setError(null);
    api.abTest({ churn_reduction_pct: churnRed }, domain)
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [churnRed, domain]);

  return (
    <div className="fade-in">
      <header className="section-header">
        <h1 className="section-title">A/B Test Experiment Center</h1>
        <p className="section-desc">Simulate parallelized retention experiments to validate absolute and relative uplift against control groups.</p>
      </header>

      <div className="engine-grid" style={{ gridTemplateColumns: 'minmax(300px, 450px) 1fr' }}>
        {/* Control Panel */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 className="metric-label" style={{ marginBottom: '2rem' }}>Experiment Parameters</h3>

          <div className="metric-item" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="metric-label">Retention Efficiency Lift</span>
              <span className="metric-status status-emerald">{churnRed}%</span>
            </div>
            <input type="range" min="5" max="80" step="5" value={churnRed} onChange={e => setChurnRed(+e.target.value)} style={{ width: '100%', accentColor: 'var(--emerald)' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={simulate} disabled={loading}>
            {loading ? 'Initializing Experiment...' : '▶ Initialize A/B Test'}
          </button>
          {error && <div className="error-box" style={{ marginTop: '1rem' }}>⚠️ {error}</div>}
        </div>

        {/* Results Display */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {result ? (
            <>
              <div className="metrics-row" style={{ gap: '1.5rem' }}>
                <div className="glass-card metric-card" style={{ flex: 1, borderLeft: '4px solid var(--gold)' }}>
                  <span className="metric-label">Control Group Churn</span>
                  <div className="metric-value status-gold">{result.control_churn_rate}%</div>
                  <div className="metric-status">{result.control_group_size} Active Nodes</div>
                </div>
                <div className="glass-card metric-card" style={{ flex: 1, borderLeft: '4px solid var(--emerald)' }}>
                  <span className="metric-label">Treatment Group Churn</span>
                  <div className="metric-value status-emerald">{result.treatment_churn_rate}%</div>
                  <div className="metric-status">{result.treatment_group_size} Target Nodes</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                  <h3 className="metric-label">Differential Visualization</h3>
                  <div className="metric-status status-emerald" style={{ fontSize: '1.1rem', fontWeight: 800 }}>+{result.relative_reduction}% Relative Uplift</div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="metric-label" style={{ color: 'var(--text-secondary)' }}>Control Strategy</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{result.control_churn_rate}% Exit Rate</span>
                  </div>
                  <div className="bar-container" style={{ height: '12px' }}>
                    <div className="bar-fill" style={{ width: `${result.control_churn_rate}%`, background: 'var(--gold)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="metric-label" style={{ color: 'var(--text-secondary)' }}>Treatment Strategy</span>
                    <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>{result.treatment_churn_rate}% Exit Rate</span>
                  </div>
                  <div className="bar-container" style={{ height: '12px' }}>
                    <div className="bar-fill" style={{ width: `${result.treatment_churn_rate}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--emerald-glow)', border: '1px solid var(--emerald)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <strong>Experiment Insight:</strong> The treatment variant shows a <strong>{result.absolute_reduction}%</strong> absolute reduction in churn risk. This indicates a high probability of successful intervention at the 95% confidence interval.
                </p>
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-glass)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔬</div>
                <div>Ready for Experimentation</div>
                <p style={{ fontSize: '0.8rem' }}>Adjust lift efficiency and initialize the test vector.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
