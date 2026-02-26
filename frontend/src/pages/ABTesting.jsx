import { useState, useCallback } from 'react';
import { api } from '../api.js';

function SliderField({ label, min, max, step, value, onChange }) {
  const pct = ((value - min) / (max - min) * 100).toFixed(1);
  return (
    <div className="slider-group">
      <div className="slider-label">
        {label}
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        style={{ '--val': `${pct}%` }}
        onChange={e => onChange(+e.target.value)}
      />
    </div>
  );
}

export default function ABTesting() {
  const [churnRed, setChurnRed] = useState(30);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const simulate = useCallback(() => {
    setLoading(true);
    setError(null);
    api.abTest({ churn_reduction_pct: churnRed })
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [churnRed]);

  return (
    <>
      <h1 className="page-title">🧪 Retention Experiment Simulation</h1>
      <p className="page-subtitle">
        Simulated A/B test on the high-risk segment — control vs. targeted intervention.
      </p>

      <div className="card" style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
        <div className="chart-title" style={{ marginBottom: '1rem' }}>Experiment Parameters</div>
        <SliderField
          label="Expected Churn Reduction (%)"
          min={5} max={80} step={5}
          value={churnRed}
          onChange={setChurnRed}
        />
        <button
          onClick={simulate}
          disabled={loading}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.65rem',
            background: 'linear-gradient(135deg, #4A90D9, #7B68EE)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Simulating…' : '▶ Run A/B Test'}
        </button>
        {error && <div className="error-box" style={{ marginTop: '0.8rem' }}>⚠️ {error}</div>}
      </div>

      {result && (
        <>
          <div className="grid-3" style={{ marginBottom: '1rem' }}>
            <div className="result-card">
              <div className="result-label">Control Group Churn</div>
              <div className="result-value red">{result.control_churn_rate}%</div>
              <div className="result-sub">{result.control_group_size} customers (no offer)</div>
            </div>
            <div className="result-card">
              <div className="result-label">Treatment Group Churn</div>
              <div className="result-value green">{result.treatment_churn_rate}%</div>
              <div className="result-sub">{result.treatment_group_size} customers (with offer)</div>
            </div>
            <div className="result-card">
              <div className="result-label">Churn Reduction</div>
              <div className="result-value blue">{result.absolute_reduction}pp</div>
              <div className="result-sub">{result.relative_reduction}% relative lift</div>
            </div>
          </div>

          <div className="insight-box">
            🔬 Targeted intervention reduces churn by&nbsp;
            <strong>{result.absolute_reduction}%</strong> (absolute) in the high-risk segment.
            This translates to a&nbsp;<strong>{result.relative_reduction}% relative improvement</strong>&nbsp;
            over the control group, demonstrating statistically meaningful impact of the retention campaign.
          </div>

          {/* Visual comparison bar */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="chart-title" style={{ marginBottom: '1rem' }}>Visual Comparison</div>
            {[
              { label: 'Control Group', value: result.control_churn_rate, color: 'var(--red)', max: 100 },
              { label: 'Treatment Group', value: result.treatment_churn_rate, color: 'var(--green)', max: 100 },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  <span>{label}</span>
                  <strong style={{ color }}>{value}%</strong>
                </div>
                <div style={{ background: '#1E2433', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${value}%`,
                    background: color,
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="loading" style={{ height: 200 }}>
          Click <strong>Run A/B Test</strong> to see results
        </div>
      )}
    </>
  );
}
