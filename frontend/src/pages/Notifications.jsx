import { useState } from 'react';

export default function Notifications() {
    const [alerts, setAlerts] = useState([
        { id: 1, title: 'Model Recalibration Complete', time: '2 mins ago', type: 'success', desc: 'XGBoost vector updated for Telecom domain with 98.4% confidence.' },
        { id: 2, title: 'High-Risk Segment Detected', time: '1 hour ago', type: 'warning', desc: '24 new customers identified in the >85% churn probability decile.' },
        { id: 3, title: 'System Maintenance', time: '5 hours ago', type: 'info', desc: 'Backend kernels will undergo routine optimization at 02:00 UTC.' },
    ]);

    return (
        <div className="fade-in">
            <header className="section-header">
                <h1 className="section-title">System Notifications</h1>
                <p className="section-desc">Real-time intelligence alerts and platform status updates from the Customer Churn Prediction Intelligence System neural core.</p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {alerts.map(alert => (
                    <div key={alert.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: alert.type === 'success' ? 'var(--emerald-glow)' : alert.type === 'warning' ? 'var(--gold-glow)' : 'var(--bg-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                        }}>
                            {alert.type === 'success' ? '✓' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{alert.title}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{alert.time}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{alert.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
