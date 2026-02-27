import { useState } from 'react';

export default function Settings() {
    const [configs, setConfigs] = useState([
        { label: 'Neural Engine Precision', value: 'High (Ensemble)', type: 'select', options: ['High (Ensemble)', 'Medium (Balanced)', 'Fast (Linear)'] },
        { label: 'Cloud Vector Sync', value: true, type: 'toggle' },
        { label: 'Automated CRM Actuation', value: false, type: 'toggle' },
        { label: 'Reporting Interval', value: 'Real-time', type: 'select', options: ['Real-time', 'Daily', 'Weekly'] },
    ]);

    return (
        <div className="fade-in">
            <header className="section-header">
                <h1 className="section-title">Platform Settings</h1>
                <p className="section-desc">Configure the Customer Churn Prediction Intelligence System orchestration layer and model parameters.</p>
            </header>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {configs.map((config, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: i < configs.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{config.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjust primary system parameters</div>
                            </div>
                            <div>
                                {config.type === 'select' ? (
                                    <select className="btn btn-outline" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                                        {config.options.map(opt => <option key={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <div style={{
                                        width: '50px', height: '24px', borderRadius: '20px',
                                        background: config.value ? 'var(--emerald)' : 'var(--bg-surface)',
                                        position: 'relative', cursor: 'pointer', border: '1px solid var(--border-glass)'
                                    }}>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            position: 'absolute', top: '2px', left: config.value ? '28px' : '3px',
                                            transition: '0.3s'
                                        }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary">Save Configuration</button>
                    <button className="btn btn-outline">Reset to Defaults</button>
                </div>
            </div>
        </div>
    );
}
