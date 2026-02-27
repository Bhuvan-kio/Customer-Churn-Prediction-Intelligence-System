import { useState } from 'react';

// ─── Simulated Data ───────────────────────────────────
const LOYAL_USERS = [
    { id: 'USR-1021', name: 'Ananya R.', tenure: 48, plan: 'Premium', spend: '$124/mo', loyalty_score: 94, status: 'Fatigued' },
    { id: 'USR-2034', name: 'Kiran M.', tenure: 36, plan: 'Standard', spend: '$67/mo', loyalty_score: 88, status: 'Active' },
    { id: 'USR-3012', name: 'Priya S.', tenure: 60, plan: 'Premium', spend: '$148/mo', loyalty_score: 97, status: 'Fatigued' },
    { id: 'USR-4088', name: 'Rahul T.', tenure: 24, plan: 'Standard', spend: '$55/mo', loyalty_score: 81, status: 'Active' },
    { id: 'USR-5001', name: 'Sneha P.', tenure: 54, plan: 'Enterprise', spend: '$220/mo', loyalty_score: 99, status: 'Fatigued' },
];

const AT_RISK_USERS = [
    { id: 'USR-9021', name: 'Amit K.', risk: 91, last_active: '14 days ago', plan: 'Standard', reason: 'Reduced usage' },
    { id: 'USR-8034', name: 'Deepa N.', risk: 85, last_active: '21 days ago', plan: 'Premium', reason: 'Support complaints' },
    { id: 'USR-7099', name: 'Vikas S.', risk: 79, last_active: '9 days ago', plan: 'Standard', reason: 'Plan downgrade' },
    { id: 'USR-6054', name: 'Meera L.', risk: 74, last_active: '18 days ago', plan: 'Standard', reason: 'Reduced usage' },
];

const REWARD_TEMPLATES = [
    { id: 'r1', label: 'Loyalty Cashback', icon: '💵', desc: 'Credit 10% of monthly bill back to account' },
    { id: 'r2', label: 'Free Month Trial', icon: '🎁', desc: 'Offer one full month of free service' },
    { id: 'r3', label: 'Plan Upgrade', icon: '⬆️', desc: 'Upgrade to next tier for 3 months at no cost' },
    { id: 'r4', label: 'Exclusive Access', icon: '🌟', desc: 'Unlock premium features & priority support' },
    { id: 'r5', label: 'Points Bonus', icon: '🏅', desc: 'Grant 500 loyalty points redeemable on bill' },
    { id: 'r6', label: 'Re-engagement', icon: '🔄', desc: '25% discount on next 2 billing cycles' },
];

const METRICS = [
    { label: 'Rewards Dispatched', value: '1,248', sub: 'This month', color: 'var(--emerald)' },
    { label: 'Avg. Loyalty Score', value: '91.8', sub: '↑ +3.2 pts', color: 'var(--emerald)' },
    { label: 'Re-engagement Rate', value: '68.4%', sub: 'At-risk conversions', color: '#f59e0b' },
    { label: 'Revenue Retained', value: '$48,250', sub: 'Projected monthly', color: 'var(--emerald)' },
];

function StatusBadge({ tier }) {
    const c = tier === 'Fatigued' ? '#f59e0b' : 'var(--emerald)';
    return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: c + '22', color: c, border: `1px solid ${c}`, whiteSpace: 'nowrap' }}>
            {tier}
        </span>
    );
}

export default function RewardSystem() {
    const [activeTab, setActiveTab] = useState('loyal');
    const [selectedReward, setSelectedReward] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [dispatched, setDispatched] = useState(new Set());
    const [campaignName, setCampaignName] = useState('');
    const [launchStatus, setLaunchStatus] = useState(null);

    const users = activeTab === 'loyal' ? LOYAL_USERS : AT_RISK_USERS;

    const toggleUser = (id) => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDispatch = () => {
        if (!selectedReward || selectedUsers.size === 0) return;
        setLaunchStatus('loading');
        setTimeout(() => {
            setDispatched(prev => new Set([...prev, ...selectedUsers]));
            setLaunchStatus('success');
            setSelectedUsers(new Set());
            setTimeout(() => setLaunchStatus(null), 3500);
        }, 1800);
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <header className="section-header" style={{ marginBottom: '2rem' }}>
                <h1 className="section-title">Reward Intelligence System</h1>
                <p className="section-desc">
                    Retain loyal users and re-engage at-risk customers with precision-targeted reward campaigns backed by churn intelligence.
                </p>
            </header>

            {/* KPI Metrics */}
            <div className="metrics-row" style={{ marginBottom: '2.5rem' }}>
                {METRICS.map(m => (
                    <div key={m.label} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
                        <div className="metric-label">{m.label}</div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: m.color, margin: '0.25rem 0' }}>{m.value}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { key: 'loyal', icon: '⭐', label: 'Loyal User Rewards', count: LOYAL_USERS.length },
                    { key: 'risk', icon: '🚨', label: 'At-Risk Re-engagement', count: AT_RISK_USERS.length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={activeTab === tab.key ? 'btn btn-primary' : 'btn btn-outline'}
                        onClick={() => { setActiveTab(tab.key); setSelectedUsers(new Set()); }}
                    >
                        {tab.icon} {tab.label}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: '10px' }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* AI Insight */}
            <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', borderLeft: '3px solid var(--emerald)' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {activeTab === 'loyal'
                        ? <><strong>3 of your top loyal users</strong> show fatigue signals — reduced activity despite high tenure. A <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>Loyalty Cashback</span> or <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>Plan Upgrade</span> has a predicted <strong>84% retention lift</strong> for this cohort.</>
                        : <><strong>High-risk users</strong> have been inactive on average <strong>15+ days</strong>. A time-limited <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Re-engagement Offer</span> has a predicted <strong>68% win-back rate</strong>.</>
                    }
                </p>
            </div>

            {/* Customer Table */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {activeTab === 'loyal' ? '⭐ Loyal Customer Segment' : '🚨 At-Risk Customer Segment'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedUsers.size} selected</span>
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            onClick={() => setSelectedUsers(new Set(users.map(u => u.id)))}>
                            Select All
                        </button>
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            onClick={() => setSelectedUsers(new Set())}>
                            Clear
                        </button>
                    </div>
                </div>

                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}>✓</th>
                                <th>User ID</th>
                                <th>Name</th>
                                {activeTab === 'loyal' ? (
                                    <>
                                        <th>Tenure</th>
                                        <th>Plan</th>
                                        <th>Monthly Spend</th>
                                        <th>Loyalty Score</th>
                                        <th>Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Risk Score</th>
                                        <th>Last Active</th>
                                        <th>Trigger Reason</th>
                                        <th>Plan</th>
                                    </>
                                )}
                                <th>Reward</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const isSelected = selectedUsers.has(u.id);
                                const isDispatched = dispatched.has(u.id);
                                return (
                                    <tr key={u.id} style={{ opacity: isDispatched ? 0.45 : 1, cursor: isDispatched ? 'default' : 'pointer' }}
                                        onClick={() => !isDispatched && toggleUser(u.id)}>
                                        <td>
                                            <div style={{ width: 18, height: 18, borderRadius: 4, background: isSelected ? 'var(--emerald)' : 'var(--bg-surface)', border: `2px solid ${isSelected ? 'var(--emerald)' : 'var(--border-glass)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isSelected && <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.id}</td>
                                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{u.name}</td>
                                        {activeTab === 'loyal' ? (
                                            <>
                                                <td style={{ whiteSpace: 'nowrap' }}>{u.tenure} mo</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{u.plan}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{u.spend}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <div className="bar-container" style={{ width: 70 }}>
                                                            <div className="bar-fill" style={{ width: `${u.loyalty_score}%` }} />
                                                        </div>
                                                        <span style={{ fontWeight: 800, color: 'var(--emerald)', whiteSpace: 'nowrap' }}>{u.loyalty_score}</span>
                                                    </div>
                                                </td>
                                                <td><StatusBadge tier={u.status} /></td>
                                            </>
                                        ) : (
                                            <>
                                                <td><span style={{ fontWeight: 800, color: u.risk > 85 ? 'var(--gold)' : 'var(--text-primary)' }}>{u.risk}%</span></td>
                                                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.last_active}</td>
                                                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{u.reason}</td>
                                                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.plan}</td>
                                            </>
                                        )}
                                        <td>
                                            {isDispatched
                                                ? <span style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>✓ Rewarded</span>
                                                : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Campaign Builder (full-width below table) */}
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--emerald-glow)' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎯 Campaign Builder
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Left: Name + Reward Picker */}
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                            Campaign Name
                        </label>
                        <input
                            type="text"
                            value={campaignName}
                            onChange={e => setCampaignName(e.target.value)}
                            placeholder={activeTab === 'loyal' ? 'e.g. Loyalty Appreciation Q4' : 'e.g. Win-Back Campaign Q4'}
                            style={{
                                width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)',
                                borderRadius: '10px', padding: '0.7rem 1rem', color: 'var(--text-primary)',
                                fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', marginBottom: '1.5rem',
                            }}
                        />

                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>
                            Select Reward Type
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {REWARD_TEMPLATES.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedReward(r)}
                                    style={{
                                        padding: '1rem 0.75rem', borderRadius: '12px', cursor: 'pointer',
                                        border: `2px solid ${selectedReward?.id === r.id ? 'var(--emerald)' : 'var(--border-glass)'}`,
                                        background: selectedReward?.id === r.id ? 'var(--emerald-glow)' : 'var(--bg-surface)',
                                        transition: 'all 0.2s', textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{r.icon}</div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.25rem', lineHeight: 1.3 }}>{r.label}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Summary + Launch */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>
                                Campaign Summary
                            </label>
                            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                                {[
                                    ['Segment', activeTab === 'loyal' ? '⭐ Loyal Users' : '🚨 At-Risk Users'],
                                    ['Recipients', `${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''} selected`],
                                    ['Reward Type', selectedReward ? `${selectedReward.icon} ${selectedReward.label}` : '— not selected'],
                                    ['Campaign Name', campaignName || '— not named'],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                        <strong style={{ maxWidth: '55%', textAlign: 'right' }}>{v}</strong>
                                    </div>
                                ))}
                            </div>

                            {/* Readiness indicators */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {[
                                    { ok: selectedUsers.size > 0, label: `${selectedUsers.size} recipient(s) selected` },
                                    { ok: !!selectedReward, label: selectedReward ? `Reward: ${selectedReward.label}` : 'No reward type selected' },
                                    { ok: !!campaignName, label: campaignName ? `Name: "${campaignName}"` : 'Campaign name is empty' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: item.ok ? 'var(--emerald)' : 'var(--text-muted)' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: item.ok ? 'var(--emerald-glow)' : 'var(--bg-surface)', border: `1.5px solid ${item.ok ? 'var(--emerald)' : 'var(--border-glass)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>
                                            {item.ok ? '✓' : '○'}
                                        </span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem', opacity: (!selectedReward || selectedUsers.size === 0 || launchStatus === 'loading') ? 0.55 : 1 }}
                                onClick={handleDispatch}
                                disabled={!selectedReward || selectedUsers.size === 0 || launchStatus === 'loading'}
                            >
                                {launchStatus === 'loading' ? '⏳ Dispatching Campaign...' : '🚀 Launch Reward Campaign'}
                            </button>

                            {launchStatus === 'success' && (
                                <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--emerald-glow)', border: '1px solid var(--emerald)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald)' }}>
                                    ✓ Campaign dispatched successfully! Rewards are being delivered to all recipients.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
