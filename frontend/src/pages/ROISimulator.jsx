import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

function SliderField({ label, min, max, step, value, onChange }) {
  const pct = ((value - min) / (max - min) * 100).toFixed(1);
  return (
    <div className="slider-group">
      <div className="slider-label">
        {label}
        <span>{value}</span>
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

export default function ROISimulator() {
  const [avgRev,    setAvgRev]    = useState(500);
  const [offerCost, setOfferCost] = useState(50);
  const [churnRed,  setChurnRed]  = useState(30);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const simulate = useCallback(() => {
    setLoading(true);
    setError(null);
    api.roiSimulation({ avg_revenue: avgRev, offer_cost: offerCost, churn_reduction_pct: churnRed })
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [avgRev, offerCost, churnRed]);

  // Auto-simulate on mount
  useEffect(() => { simulate(); }, []);
  // Re-simulate on param change (manual button triggers it too)
  const handleChange = (setter) => (v) => { setter(v); };

  return (
    <>
      <h1 className="page-title">💰 ROI Simulator</h1>
      <p className="page-subtitle">
        Adjust parameters to see the projected business impact of your retention campaign.
      </p>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Controls */}
        <div className="card">
          <div className="chart-title" style={{ marginBottom: '1.2rem' }}>
            Campaign Parameters
          </div>
          <SliderField
            label="Average Revenue per Customer ($)"
            min={100} max={2000} step={50}
            value={avgRev}
            onChange={v => setAvgRev(v)}
          />
          <SliderField
            label="Retention Offer Cost ($)"
            min={10} max={200} step={10}
            value={offerCost}
            onChange={v => setOfferCost(v)}
          />
          <SliderField
            label="Expected Churn Reduction (%)"
            min={5} max={80} step={5}
            value={churnRed}
            onChange={v => setChurnRed(v)}
          />
          <button
            onClick={simulate}
            disabled={loading}
            style={{
              marginTop: '1.2rem',
              width: '100%',
              padding: '0.7rem',
              background: 'linear-gradient(135deg, #4A90D9, #7B68EE)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Calculating…' : '▶ Run Simulation'}
          </button>

          {error && <div className="error-box" style={{ marginTop: '0.8rem' }}>⚠️ {error}</div>}
        </div>

        {/* Results */}
        <div>
          {result ? (
            <>
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="result-card">
                  <div className="result-label">Revenue Saved</div>
                  <div className="result-value green">${result.revenue_saved.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Campaign Cost</div>
                  <div className="result-value red">${result.offer_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Net Profit</div>
                  <div className={`result-value ${result.net_profit >= 0 ? 'green' : 'red'}`}>
                    ${result.net_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-label">ROI</div>
                  <div className={`result-value ${result.roi_percent >= 0 ? 'blue' : 'red'}`}>
                    {result.roi_percent.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="card card-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Customers targeted</span>
                  <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{result.customers_targeted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Churners in segment</span>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>{result.churners_in_segment}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Estimated saves</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{result.churners_saved.toFixed(0)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="loading" style={{ height: 260 }}>
              <div className="spinner" /> Running simulation…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
