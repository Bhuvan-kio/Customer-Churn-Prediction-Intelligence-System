import { useState } from 'react';
import Overview         from './pages/Overview.jsx';
import ModelPerformance from './pages/ModelPerformance.jsx';
import FeatureImportance from './pages/FeatureImportance.jsx';
import RiskRanking      from './pages/RiskRanking.jsx';
import RetentionPlaybook from './pages/RetentionPlaybook.jsx';
import ROISimulator     from './pages/ROISimulator.jsx';
import ABTesting        from './pages/ABTesting.jsx';
import Architecture     from './pages/Architecture.jsx';

const NAV = [
  {
    section: 'ANALYTICS',
    items: [
      { key: 'overview',           icon: '📊', label: 'Overview' },
      { key: 'model_performance',  icon: '📈', label: 'Model Performance' },
      { key: 'feature_importance', icon: '🔎', label: 'Feature Importance' },
    ],
  },
  {
    section: 'CUSTOMERS',
    items: [
      { key: 'risk_ranking',       icon: '🎯', label: 'Risk Ranking' },
      { key: 'retention_playbook', icon: '💡', label: 'Retention Playbook' },
    ],
  },
  {
    section: 'SIMULATION',
    items: [
      { key: 'roi_simulator', icon: '💰', label: 'ROI Simulator' },
      { key: 'ab_testing',    icon: '🧪', label: 'A/B Testing' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { key: 'architecture', icon: '🏗', label: 'Architecture' },
    ],
  },
];

const PAGES = {
  overview:           Overview,
  model_performance:  ModelPerformance,
  feature_importance: FeatureImportance,
  risk_ranking:       RiskRanking,
  retention_playbook: RetentionPlaybook,
  roi_simulator:      ROISimulator,
  ab_testing:         ABTesting,
  architecture:       Architecture,
};

export default function App() {
  const [page, setPage] = useState('overview');
  const Page = PAGES[page] ?? Overview;

  return (
    <div className="layout">
      {/* ─── Sidebar ─── */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-title">🏆 Churn Intelligence</span>
          <span className="brand-sub">Risk · Predict · Retain</span>
        </div>

        {NAV.map(({ section, items }) => (
          <div className="nav-section" key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map(({ key, icon, label }) => (
              <div
                key={key}
                className={`nav-item${page === key ? ' active' : ''}`}
                onClick={() => setPage(key)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          ● Live Dashboard · FastAPI + React<br />Churn Intelligence v2.1
        </div>
      </nav>

      {/* ─── Page ─── */}
      <main className="main-content">
        <Page navigate={setPage} />
      </main>
    </div>
  );
}
