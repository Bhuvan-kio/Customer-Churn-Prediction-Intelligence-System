import { useState, useEffect } from 'react';
import { api } from '../api.js';

const PRIORITY_CLASS = {
  Critical: 'priority-critical',
  High:     'priority-high',
  Medium:   'priority-medium',
};

export default function RetentionPlaybook() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.getRetentionPlaybook()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;
  if (error)   return <div className="error-box">⚠️ {error}</div>;

  return (
    <>
      <h1 className="page-title">💡 Personalized Retention Strategy</h1>
      <p className="page-subtitle">
        Rule-based retention playbook — match each risk profile to an optimal intervention.
      </p>

      {data.strategies.map((s, i) => (
        <div className="strategy-card" key={i}>
          <div className="strategy-icon">{s.icon}</div>
          <div className="strategy-content">
            <div className={`strategy-priority ${PRIORITY_CLASS[s.priority] ?? 'priority-medium'}`}>
              {s.priority}
            </div>
            <div className="strategy-condition">{s.condition}</div>
            <div className="strategy-action">{s.action}</div>
          </div>
        </div>
      ))}
    </>
  );
}
