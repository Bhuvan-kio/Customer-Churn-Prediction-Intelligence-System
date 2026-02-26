import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Overview({ navigate }) {
  const [kpis, setKpis]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.getKpis()
      .then(setKpis)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error)   return <div className="error-box">⚠️ {error} — is the FastAPI backend running on port 8000?</div>;

  const quickNav = [
    { icon: '📈', name: 'Model Performance', desc: 'ROC curves, gain chart, model comparison', key: 'model_performance' },
    { icon: '🔎', name: 'Feature Importance', desc: 'Top churn drivers from Random Forest',    key: 'feature_importance' },
    { icon: '🎯', name: 'Risk Ranking',        desc: 'High-risk customers with retention actions', key: 'risk_ranking' },
    { icon: '💰', name: 'ROI Simulator',       desc: 'Project revenue impact of retention',    key: 'roi_simulator' },
  ];

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="hero-title">Customer Churn Risk Intelligence</h1>
        <p className="hero-subtitle">Predict &nbsp;·&nbsp; Rank &nbsp;·&nbsp; Retain &nbsp;·&nbsp; Optimize</p>
      </div>

      {/* KPI row */}
      <div className="grid-3" style={{ marginBottom: '0.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Customers</div>
          <div className="kpi-value blue">{kpis.total_customers.toLocaleString()}</div>
          <div className="kpi-caption">Dataset: {kpis.dataset}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Overall Churn Rate</div>
          <div className="kpi-value red">{kpis.churn_rate}%</div>
          <div className="kpi-caption">Historical attrition</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Best Model AUC</div>
          <div className="kpi-value green">{kpis.model_auc}</div>
          <div className="kpi-caption">{kpis.best_model}</div>
        </div>
      </div>

      <hr className="divider" />

      {/* Quick-nav cards */}
      <div style={{ marginBottom: '0.8rem' }}>
        <h2 className="page-title">🚀 Quick Navigation</h2>
        <p className="page-subtitle">Use the sidebar or the cards below to explore all sections.</p>
      </div>

      <div className="grid-4">
        {quickNav.map(({ icon, name, desc, key }) => (
          <div
            key={key}
            className="nav-quick-card"
            onClick={() => navigate(key)}
          >
            <div className="card-icon">{icon}</div>
            <div className="card-name">{name}</div>
            <div className="card-desc">{desc}</div>
          </div>
        ))}
      </div>

      <hr className="divider" />

      {/* Dataset summary */}
      <h2 className="page-title">📋 Dataset Summary</h2>
      <div className="grid-3" style={{ marginTop: '0.8rem' }}>
        <div className="card card-sm">
          <div className="kpi-label">Baseline AUC (Linear)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.3rem' }}>{kpis.baseline_auc}</div>
        </div>
        <div className="card card-sm">
          <div className="kpi-label">Champion Model</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)', marginTop: '0.3rem' }}>{kpis.best_model}</div>
        </div>
        <div className="card card-sm">
          <div className="kpi-label">Lift Over Baseline</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)', marginTop: '0.3rem' }}>
            +{((kpis.model_auc - kpis.baseline_auc) * 100).toFixed(1)}pp AUC
          </div>
        </div>
      </div>
    </>
  );
}
