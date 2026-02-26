export default function Architecture() {
  const pipeline = [
    { label: '📥 Telecom Usage Data', desc: 'Call logs, billing, service history' },
    { label: '⚙️ Feature Pipeline',   desc: 'Normalization, encoding, imputation' },
    { label: '🤖 Ensemble Models',     desc: 'Linear · XGBoost · Random Forest' },
    { label: '📊 Risk Scores',         desc: 'Probability scores per customer' },
    { label: '🔗 CRM Integration',     desc: 'Push top-risk segment to CRM' },
    { label: '📧 Retention Campaign',  desc: 'Targeted offers, callbacks, SMS' },
    { label: '📈 Drift Monitoring',    desc: 'Monthly model performance review' },
  ];

  const techStack = [
    { icon: '🐍', name: 'Python 3.14',   role: 'ML & Backend runtime' },
    { icon: '⚡', name: 'FastAPI',        role: 'REST API serving predictions' },
    { icon: '⚛️', name: 'React + Vite',  role: 'Interactive frontend' },
    { icon: '📊', name: 'Recharts',       role: 'Data visualizations' },
    { icon: '🌳', name: 'Random Forest',  role: 'Champion churn model' },
    { icon: '🚀', name: 'XGBoost',        role: 'Gradient-boosted challenger' },
    { icon: '📏', name: 'Scikit-learn',   role: 'Feature pipeline & metrics' },
    { icon: '🐼', name: 'Pandas / NumPy', role: 'Data processing' },
  ];

  return (
    <>
      <h1 className="page-title">🏗 Production Architecture</h1>
      <p className="page-subtitle">
        How this telecom churn system scales from prototype to enterprise deployment.
      </p>

      {/* Pipeline flow */}
      <div className="arch-box" style={{ marginBottom: '1.5rem' }}>
        <div className="arch-flow">
          {pipeline.map((step, i) => (
            <span key={i}>
              <span style={{ display: 'inline-block' }}>
                <div>{step.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>{step.desc}</div>
              </span>
              {i < pipeline.length - 1 && (
                <span style={{ color: 'var(--border)', margin: '0 0.4rem', fontWeight: 300 }}> → </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <h2 className="page-title" style={{ marginBottom: '0.8rem' }}>🛠 Tech Stack</h2>
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {techStack.map(({ icon, name, role }) => (
          <div className="card card-sm" key={name} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: '0.88rem' }}>{name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{role}</div>
          </div>
        ))}
      </div>

      <div className="insight-box">
        🚀 <strong>In production</strong>, churn risk scores are computed daily from telecom usage and
        service logs, pushed to CRM tools to auto-trigger retention journeys, and monitored for model
        drift monthly. The FastAPI layer supports real-time scoring during customer support and outbound
        retention campaigns.
      </div>
    </>
  );
}
