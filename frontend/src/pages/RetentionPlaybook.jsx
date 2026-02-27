import { useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';

const PRIORITY_COLOR = {
  Critical: 'status-gold',
  High: 'status-emerald',
  Medium: 'status-muted',
};

const PRIORITY_MODEL = {
  Critical: { reachPct: 0.26, liftPct: 0.22, costPerCustomer: 95, severity: 'critical' },
  High: { reachPct: 0.18, liftPct: 0.14, costPerCustomer: 70, severity: 'high' },
  Medium: { reachPct: 0.12, liftPct: 0.08, costPerCustomer: 45, severity: 'medium' },
};

const FIXED_BUDGET = 50000;

export default function RetentionPlaybook({ domain }) {
  const [data, setData] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabledMap, setEnabledMap] = useState({});
  const [optimizerMetrics, setOptimizerMetrics] = useState({});
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setSegmentData(null);
    Promise.all([
      api.getRetentionPlaybook(domain),
      api.getRiskRanking(domain),
    ])
      .then(([playbookRes, riskRes]) => {
        setData(playbookRes);
        setSegmentData(riskRes);
        const initialMap = {};
        (playbookRes?.strategies ?? []).forEach((_, idx) => {
          initialMap[idx] = idx === 0;
        });
        setEnabledMap(initialMap);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [domain]);

  const strategyRows = useMemo(() => {
    const totalCustomers = segmentData?.total_in_segment ?? 0;
    const avgRevenue = 500;
    const avgRiskProb = 0.45;

    return (data?.strategies ?? []).map((strategy, idx) => {
      const model = PRIORITY_MODEL[strategy.priority] ?? PRIORITY_MODEL.Medium;
      const backendMetric = optimizerMetrics[idx];
      const targetedCustomers = Math.round(totalCustomers * model.reachPct);
      const preventedChurners = targetedCustomers * avgRiskProb * model.liftPct;
      const estimatedCost = targetedCustomers * model.costPerCustomer;
      const netImpact = preventedChurners * avgRevenue - estimatedCost;

      return {
        ...strategy,
        idx,
        targetedCustomers: backendMetric?.targeted_customers ?? targetedCustomers,
        preventedChurners: backendMetric?.prevented_churners ?? preventedChurners,
        estimatedCost: backendMetric?.estimated_cost ?? estimatedCost,
        netImpact: backendMetric?.estimated_net_impact ?? netImpact,
      };
    });
  }, [data, segmentData, optimizerMetrics]);

  const enabledStrategies = strategyRows.filter(s => enabledMap[s.idx]);

  const totals = useMemo(() => {
    const covered = enabledStrategies.reduce((sum, s) => sum + s.targetedCustomers, 0);
    const cost = enabledStrategies.reduce((sum, s) => sum + s.estimatedCost, 0);
    const net = enabledStrategies.reduce((sum, s) => sum + s.netImpact, 0);
    return { covered, cost, net };
  }, [enabledStrategies]);

  function optimizePortfolio() {
    setOptimizing(true);
    api.optimizeRetentionPortfolio({ budget: FIXED_BUDGET }, domain)
      .then((res) => {
        const selectedIds = new Set(res?.selected_strategy_ids ?? []);
        const nextMap = {};
        (data?.strategies ?? []).forEach((_, idx) => nextMap[idx] = selectedIds.has(idx));
        setEnabledMap(nextMap);
        const metricMap = {};
        (res?.strategy_metrics ?? []).forEach(m => metricMap[m.strategy_id] = m);
        setOptimizerMetrics(metricMap);
      })
      .catch((e) => setError(e.message))
      .finally(() => setOptimizing(false));
  }

  if (loading) return <div className="loading"><div className="spinner" /> Loading…</div>;

  return (
    <div className="fade-in">
      <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="section-title">Retention Strategy Playbook</h1>
          <p className="section-desc">Algorithmically weighted intervention mapping for high-risk customer segments.</p>
        </div>
        <button className="btn btn-primary" onClick={optimizePortfolio} disabled={optimizing}>
          {optimizing ? 'Recalculating...' : 'Optimize Portfolio'}
        </button>
      </header>

      {/* Global Impact Summary */}
      <div className="metrics-row" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card metric-card">
          <span className="metric-label">Projected Net Impact</span>
          <div className={`metric-value ${totals.net >= 0 ? 'status-emerald' : 'status-gold'}`}>${Math.round(totals.net).toLocaleString()}</div>
          <div className={`metric-status ${totals.net >= 0 ? 'status-emerald' : 'status-gold'}`}>{totals.net >= 0 ? 'Positive ROI' : 'Negative Net Impact'}</div>
        </div>
        <div className="glass-card metric-card">
          <span className="metric-label">Execution Budget</span>
          <div className="metric-value">${Math.round(totals.cost).toLocaleString()}</div>
          <div className="metric-status">Target: ${FIXED_BUDGET.toLocaleString()}</div>
        </div>
        <div className="glass-card metric-card">
          <span className="metric-label">Segment Reach</span>
          <div className="metric-value">{totals.covered.toLocaleString()}</div>
          <div className="metric-status">Active Nodes</div>
        </div>
      </div>

      {/* Strategy Table */}
      <div className="glass-card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Apply</th>
                <th>Priority</th>
                <th>Strategy Framework</th>
                <th>Primary Action</th>
                <th style={{ textAlign: 'right' }}>Targeting</th>
                <th style={{ textAlign: 'right' }}>Est. Cost</th>
                <th style={{ textAlign: 'right' }}>Projected Lift</th>
              </tr>
            </thead>
            <tbody>
              {strategyRows.map((s) => (
                <tr key={s.idx} style={{ opacity: enabledMap[s.idx] ? 1 : 0.4 }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!enabledMap[s.idx]}
                      onChange={() => setEnabledMap(p => ({ ...p, [s.idx]: !p[s.idx] }))}
                      style={{ width: 18, height: 18, accentColor: 'var(--emerald)' }}
                    />
                  </td>
                  <td>
                    <span className={`metric-status ${PRIORITY_COLOR[s.priority]}`}>{s.priority.toUpperCase()}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{s.condition}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Condition Triggered</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{s.action}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.targetedCustomers}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${Math.round(s.estimatedCost)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="status-emerald" style={{ fontWeight: 800 }}>+{(s.preventedChurners * 10).toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
