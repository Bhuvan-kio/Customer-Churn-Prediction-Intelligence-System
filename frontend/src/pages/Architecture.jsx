export default function Architecture() {
  const pipeline = [
    { label: 'Data Ingestion Node', desc: 'Enterprise data streams from CRM/Billing', icon: '📥' },
    { label: 'Feature Engineering', desc: 'Vector normalization & encoding', icon: '⚙️' },
    { label: 'Inference Engine', desc: 'Random Forest / XGBoost ensemble', icon: '🤖' },
    { label: 'Risk Scoring Vector', desc: 'Real-time probability mapping', icon: '📊' },
    { label: 'Retention API', desc: 'FastAPI orchestration layer', icon: '🔗' },
    { label: 'Downstream Actuation', desc: 'Automated CRM retention events', icon: '📧' },
  ];

  const techStack = [
    { icon: '🐍', name: 'Python Engine', role: 'ML & Backend runtime' },
    { icon: '⚡', name: 'FastAPI', role: 'REST API orchestration' },
    { icon: '⚛️', name: 'React UI', role: 'Vite-powered interface' },
    { icon: '🌳', name: 'Random Forest', role: 'Production churn model' },
    { icon: '🚀', name: 'XGBoost', role: 'Gradient-boosted model' },
    { icon: '📏', name: 'Scikit-learn', role: 'Feature pipelines' },
    { icon: '📊', name: 'Recharts', role: 'Vector visualizations' },
    { icon: '🎨', name: 'Custom CSS', role: 'Glassmorphic design system' },
  ];

  return (
    <div className="fade-in">
      <header className="section-header">
        <h1 className="section-title">System Architecture Nodes</h1>
        <p className="section-desc">Technical orchestration of the Churn Risk Engine v4.0 architecture.</p>
      </header>

      {/* Pipeline flow */}
      <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Data Processing Pipeline</h2>
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          {pipeline.map((step, i) => (
            <div key={i} style={{ flex: 1, minWidth: '180px', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{step.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{step.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</div>
              {i < pipeline.length - 1 && (
                <div style={{ position: 'absolute', top: '25%', right: '-15%', color: 'var(--emerald)', fontSize: '1.5rem', opacity: 0.3 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Full-Stack Ecosystem</h2>
      <div className="engine-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {techStack.map(({ icon, name, role }) => (
          <div className="glass-card metric-card" key={name} style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>{role}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--emerald-glow)', border: '1px solid var(--emerald)' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          🚀 <strong>Architecture Overview:</strong> The system leverages a micro-app architecture where the backend (FastAPI) handles high-concurrency model inference while the frontend (React) provides real-time visualization of model artifacts and risk segments. Data flows are fully encrypted and optimized for sub-100ms response times.
        </p>
      </div>
    </div>
  );
}
