import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api, zipXY } from '../api.js';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-sidebar)', border: '1px solid var(--border-glass)',
        borderRadius: 8, padding: '0.5rem 0.8rem',
        fontSize: '0.78rem', color: 'var(--text-primary)',
      }}>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value?.toFixed(3)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ModelPerformance({ domain }) {
  const [data, setData] = useState(null);
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setData(null); setComp(null);
    Promise.all([api.getModelPerformance(domain), api.getModelComparison(domain)])
      .then(([perf, comparison]) => { setData(perf); setComp(comparison); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error) return <div className="error-box">⚠️ {error}</div>;

  // Build chart data
  const rocData = zipXY(data.lr_roc.fpr, data.lr_roc.tpr).map((pt, i) => ({
    fpr: pt.x,
    lr: pt.y,
    xgb: zipXY(data.xgb_roc.fpr, data.xgb_roc.tpr)[i]?.y ?? 0,
    rf: zipXY(data.rf_roc.fpr, data.rf_roc.tpr)[i]?.y ?? 0,
  }));

  const gainData = zipXY(data.gain_population_pct, data.gain_capture_rate).map((pt, i) => ({
    pop: +(pt.x * 100).toFixed(1),
    capture: +(pt.y * 100).toFixed(1),
    random: +(pt.x * 100).toFixed(1),
  }));

  const bestIdx = comp.models.reduce((bi, m, i, arr) =>
    m.top10_capture > arr[bi].top10_capture ? i : bi, 0);

  return (
    <>
      <h1 className="page-title">📈 Model Performance &amp; Lift Analysis</h1>
      <p className="page-subtitle">
        We trained three models — Linear Regression (baseline), XGBoost, and Random Forest —
        to find the best churn predictor.
      </p>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '1.2rem' }}>
        {/* ROC */}
        <div className="chart-card">
          <div className="chart-title">ROC Curve — 3-Model Comparison</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rocData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" />
              <XAxis dataKey="fpr" tick={{ fill: '#8892A0', fontSize: 11 }}
                label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -12, fill: '#8892A0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892A0', fontSize: 11 }}
                label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#8892A0', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#8892A0', fontSize: '0.78rem', paddingTop: '0.5rem' }} />
              <Line dataKey="lr" name={`Linear (AUC=${data.lr_auc})`} stroke="#8892A0" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              <Line dataKey="xgb" name={`XGBoost (AUC=${data.xgb_auc})`} stroke="#FFA94D" strokeWidth={2} strokeDasharray="4 2" dot={false} />
              <Line dataKey="rf" name={`Random Forest (AUC=${data.rf_auc})`} stroke="#4A90D9" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gain */}
        <div className="chart-card">
          <div className="chart-title">Cumulative Gain Chart</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gainData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" />
              <XAxis dataKey="pop" tick={{ fill: '#8892A0', fontSize: 11 }}
                label={{ value: '% Customers Targeted', position: 'insideBottom', offset: -12, fill: '#8892A0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892A0', fontSize: 11 }}
                label={{ value: '% Churn Captured', angle: -90, position: 'insideLeft', fill: '#8892A0', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#8892A0', fontSize: '0.78rem', paddingTop: '0.5rem' }} />
              <Line dataKey="capture" name={`${data.best_model} Gain`} stroke="#4A90D9" strokeWidth={2.5} dot={false} />
              <Line dataKey="random" name="Random Baseline" stroke="#2A3040" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Capture callout */}
      <div className="capture-callout">
        <div className="capture-number">{data.capture_rate_top10}%</div>
        <div className="capture-text">
          of all churners captured by targeting just the <strong>Top 10%</strong> highest-risk customers
          ({data.best_model})
        </div>
      </div>

      {/* Model Comparison */}
      {/* Model Comparison */}
      <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '3rem', marginBottom: '1.5rem' }}>
        Model Intelligence Benchmark
      </h2>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Analytical Model</th>
                <th>ROC-AUC Score</th>
                <th style={{ minWidth: 250 }}>Top 10% Risk Capture</th>
              </tr>
            </thead>
            <tbody>
              {comp.models.map((m, i) => (
                <tr key={i} style={i === bestIdx ? { filter: 'drop-shadow(0 0 8px var(--emerald-glow))' } : {}}>
                  <td style={{ fontWeight: 700, color: i === bestIdx ? 'var(--emerald)' : 'var(--text-primary)' }}>
                    {m.model} {i === bestIdx && '🏆'}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{m.roc_auc.toFixed(4)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="bar-container" style={{ flex: 1 }}>
                        <div
                          className={`bar-fill ${i === bestIdx ? '' : 'gold'}`}
                          style={{ width: `${m.top10_capture}%`, opacity: i === bestIdx ? 1 : 0.6 }}
                        />
                      </div>
                      <span style={{ fontWeight: 800, minWidth: '50px', fontSize: '0.85rem' }}>{m.top10_capture}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem', background: 'var(--emerald-glow)', border: '1px solid var(--emerald)', padding: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
          🚀 <strong>Deployment Recommendation:</strong> The engine identifies <strong>{comp.models[bestIdx]?.model}</strong> as the optimal production vector, achieving a peak capture rate of {comp.models[bestIdx]?.top10_capture}% within the high-risk decile.
        </p>
      </div>
    </>
  );
}
