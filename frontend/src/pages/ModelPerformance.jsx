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
        background: '#1A1F2E', border: '1px solid #2A3040',
        borderRadius: 8, padding: '0.5rem 0.8rem',
        fontSize: '0.78rem', color: '#F0F6FF',
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

export default function ModelPerformance() {
  const [data, setData]       = useState(null);
  const [comp, setComp]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    Promise.all([api.getModelPerformance(), api.getModelComparison()])
      .then(([perf, comparison]) => { setData(perf); setComp(comparison); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error)   return <div className="error-box">⚠️ {error}</div>;

  // Build chart data
  const rocData = zipXY(data.lr_roc.fpr, data.lr_roc.tpr).map((pt, i) => ({
    fpr: pt.x,
    lr:  pt.y,
    xgb: zipXY(data.xgb_roc.fpr, data.xgb_roc.tpr)[i]?.y ?? 0,
    rf:  zipXY(data.rf_roc.fpr, data.rf_roc.tpr)[i]?.y ?? 0,
  }));

  const gainData = zipXY(data.gain_population_pct, data.gain_capture_rate).map((pt, i) => ({
    pop:    +(pt.x * 100).toFixed(1),
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
              <Line dataKey="lr"  name={`Linear (AUC=${data.lr_auc})`}  stroke="#8892A0" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              <Line dataKey="xgb" name={`XGBoost (AUC=${data.xgb_auc})`} stroke="#FFA94D" strokeWidth={2} strokeDasharray="4 2" dot={false} />
              <Line dataKey="rf"  name={`Random Forest (AUC=${data.rf_auc})`} stroke="#4A90D9" strokeWidth={2.5} dot={false} />
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
              <Line dataKey="capture" name={`${data.best_model} Gain`}  stroke="#4A90D9" strokeWidth={2.5} dot={false} />
              <Line dataKey="random"  name="Random Baseline"            stroke="#2A3040" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
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
      <h2 className="page-title" style={{ marginTop: '1.5rem', marginBottom: '0.8rem' }}>
        🏆 Model Comparison
      </h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>ROC-AUC</th>
              <th style={{ minWidth: 200 }}>Top 10% Capture</th>
            </tr>
          </thead>
          <tbody>
            {comp.models.map((m, i) => (
              <tr key={i} style={i === bestIdx ? { background: 'rgba(74,144,217,0.06)' } : {}}>
                <td style={{ fontWeight: 600 }}>{m.model}</td>
                <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{m.roc_auc.toFixed(4)}</td>
                <td>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${m.top10_capture}%` }} />
                    </div>
                    <span className="progress-label">{m.top10_capture}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="insight-box" style={{ marginTop: '1rem' }}>
        🏆 <strong>{comp.models[bestIdx]?.model}</strong> is the primary model for deployment — it achieves
        the highest Top 10% capture rate ({comp.models[bestIdx]?.top10_capture}%).
      </div>
    </>
  );
}
