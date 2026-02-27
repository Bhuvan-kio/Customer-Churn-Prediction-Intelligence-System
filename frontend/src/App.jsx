import { useState, useEffect } from 'react';
import Overview from './pages/Overview.jsx';
import ModelPerformance from './pages/ModelPerformance.jsx';
import FeatureImportance from './pages/FeatureImportance.jsx';
import RiskRanking from './pages/RiskRanking.jsx';
import RetentionPlaybook from './pages/RetentionPlaybook.jsx';
import ROISimulator from './pages/ROISimulator.jsx';
import ABTesting from './pages/ABTesting.jsx';
import Architecture from './pages/Architecture.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import RewardSystem from './pages/RewardSystem.jsx';

const DOMAINS = [
  {
    key: 'telecom',
    label: 'Telecom',
    icon: '📡',
    color: '#10b981',
    desc: 'Predict churn across voice, data & international plan customers using call behaviour signals.',
  },
  {
    key: 'bank',
    label: 'Banking',
    icon: '🏦',
    color: '#f59e0b',
    desc: 'Identify at-risk account holders using balance, product usage, activity & support ticket patterns.',
  },
  {
    key: 'ecommerce',
    label: 'E-Commerce',
    icon: '🛍️',
    color: '#10b981',
    desc: 'Detect churning shoppers from order history, satisfaction scores, complaints & cashback trends.',
  },
];

const NAV = [
  {
    section: 'ANALYZE',
    items: [
      { key: 'overview', icon: '📊', label: 'Churn Risk Engine' },
      { key: 'risk_ranking', icon: '🏆', label: 'High-Risk Ranking' },
      { key: 'feature_importance', icon: '🧬', label: 'Multi-Platform Analysis' },
      { key: 'model_performance', icon: '⚡', label: 'Model Performance' },
    ],
  },
  {
    section: 'OPTIMIZE',
    items: [
      { key: 'retention_playbook', icon: '📋', label: 'Retention Playbook' },
      { key: 'roi_simulator', icon: '💰', label: 'ROI Simulator' },
      { key: 'ab_testing', icon: '🔬', label: 'A/B Testing' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { key: 'notifications', icon: '🔔', label: 'Notifications' },
      { key: 'architecture', icon: 'ⓘ', label: 'About Platform' },
      { key: 'settings', icon: '⚙', label: 'Settings' },
    ],
  },
];

const GLOBAL_NAV = [
  { key: 'home', icon: '🏠', label: 'Intelligence Home' },
];

const PAGES = {
  overview: Overview,
  model_performance: ModelPerformance,
  feature_importance: FeatureImportance,
  risk_ranking: RiskRanking,
  retention_playbook: RetentionPlaybook,
  roi_simulator: ROISimulator,
  ab_testing: ABTesting,
  architecture: Architecture,
  notifications: Notifications,
  settings: Settings,
  reward_system: RewardSystem,
};

function DomainPicker({ onSelect }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useState(null);

  const processFile = (file) => {
    if (!file) return;
    const allowed = ['csv', 'json', 'xlsx', 'xlxs'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadStatus({ ok: false, msg: `Invalid file type ".${ext}". Accepted: CSV, JSON, XLSX.` });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadStatus({ ok: false, msg: 'File exceeds 20MB limit.' });
      return;
    }
    setSelectedFile(file);
    setUploadStatus(null);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      document.getElementById('file-input-ccpis').click();
      return;
    }
    setIsUploading(true);
    setUploadStatus(null);
    // Simulate processing the real file
    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus({ ok: true, msg: `✓ "${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB) ingested. Kernel re-initialized.` });
    }, 1500);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadStatus(null);
  };

  return (
    <div className="engine-home" style={{ paddingBottom: '5rem' }}>
      <header className="engine-header">
        <h1 className="engine-title">
          Churn Risk Intelligence
        </h1>
        <p className="engine-subtitle">
          Command-line parity with advanced glassmorphic orchestration and multi-model inference.
        </p>
      </header>

      <div className="engine-grid" style={{ marginBottom: '4rem' }}>
        <div className="glass-card">
          <div className="upload-header" style={{ marginBottom: '2rem' }}>
            <h2 className="section-title">Advanced Intelligence Core</h2>
            <p className="engine-subtitle">Localized dataset configuration for autonomous cleaning and analysis pipelines.</p>
          </div>

          <div className="engine-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="metric-item status-emerald" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Duplicates Removed</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Redundancy Check</div>
              </div>
            </div>
            <div className="metric-item status-emerald" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Normalization Active</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Vector Scaling</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden real file input */}
        <input
          id="file-input-ccpis"
          type="file"
          accept=".csv,.json,.xlsx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Drop Zone */}
        <div
          className="glass-card dropzone-card"
          onClick={() => !selectedFile && document.getElementById('file-input-ccpis').click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            borderStyle: 'dashed', borderWidth: '2px',
            borderColor: isDragging ? '#fff' : 'var(--emerald)',
            background: isDragging ? 'var(--emerald-glow)' : undefined,
            cursor: selectedFile ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📋</span>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedFile.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'text/csv'}</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={isUploading} style={{ minWidth: '160px' }}>
                  {isUploading ? 'Processing...' : 'Ingest Dataset'}
                </button>
                <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); handleClear(); }}>✕ Clear</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
              <div style={{ fontSize: '2.5rem' }}>📤</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Intelligence Data Stream</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Drag & drop here, or click to <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>Browse Local Files</span></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>CSV, JSON, XLSX · Max 20MB</div>
            </div>
          )}

          {uploadStatus && (
            <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: uploadStatus.ok ? 'var(--emerald)' : 'var(--gold)', background: uploadStatus.ok ? 'var(--emerald-glow)' : 'var(--gold-glow)', textAlign: 'center' }}>
              {uploadStatus.msg}
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title" style={{ marginBottom: '3rem', textAlign: 'center', justifyContent: 'center' }}>Deploy Domain Strategy</h2>
      <div className="picker-grid">
        {DOMAINS.map((d) => (
          <div key={d.key} className="glass-card domain-card" onClick={() => onSelect(d.key)} style={{ borderBottom: `4px solid ${d.color}` }}>
            <div className="domain-icon">{d.icon}</div>
            <div className="domain-title">{d.label}</div>
            <div className="domain-desc">{d.desc}</div>
            <div style={{ marginTop: 'auto', paddingTop: '2rem', width: '100%' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Activate Intelligence</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [domain, setDomain] = useState(null);
  const [theme, setTheme] = useState('dark');

  const Page = PAGES[page] ?? Overview;
  const activeDomain = DOMAINS.find(d => d.key === domain);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function handleSelectDomain(key) {
    setDomain(key);
    setPage('overview');
  }

  const THEME_CYCLE = { dark: 'light', light: 'amoled', amoled: 'dark' };
  const THEME_ICONS = { dark: '☀️', light: '⬛', amoled: '🌙' };
  const THEME_LABELS = { dark: 'Switch to Light', light: 'Switch to AMOLED', amoled: 'Switch to Dark' };
  const toggleTheme = () => setTheme(prev => THEME_CYCLE[prev]);

  return (
    <div className="layout">
      {/* ─── Sidebar Redesigned ─── */}
      <nav className="sidebar">
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setDomain(null)}>
          <span style={{ background: 'var(--emerald)', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 900 }}>S</span>
          <span style={{ fontSize: '0.8rem', lineHeight: 1.2, maxWidth: '150px' }}>Customer Churn Prediction Intelligence System</span>
        </div>

        <div className="nav-section">
          <div className="nav-label">PLATFORM</div>
          {GLOBAL_NAV.map(({ key, icon, label }) => (
            <div
              key={key}
              className={`nav-link${!domain && key === 'home' ? ' active' : ''}`}
              onClick={() => key === 'home' && setDomain(null)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </div>
          ))}
          {domain && (
            <div
              className={`nav-link${page === 'reward_system' ? ' active' : ''}`}
              onClick={() => setPage('reward_system')}
            >
              <span className="nav-icon">🎁</span>
              Reward System
            </div>
          )}
        </div>

        {domain && NAV.map(({ section, items }) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {items.map(({ key, icon, label }) => (
              <div
                key={key}
                className={`nav-link${page === key ? ' active' : ''}`}
                onClick={() => setPage(key)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
                {label === 'Churn Risk Engine' && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', padding: '2px 4px', border: '1px solid currentColor', borderRadius: '4px' }}>LIVE</span>}
              </div>
            ))}
          </div>
        ))}

        <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Kernel Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--emerald)' }}>
              <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%' }}></span>
              Operational
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            v4.0.2-stable
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        {!domain ? (
          <DomainPicker onSelect={handleSelectDomain} />
        ) : (
          <>
            <div className="header-bar" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="nav-label" style={{ margin: 0 }}>
                {activeDomain?.label} Intelligence / {page.replace('_', ' ').toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => setDomain(null)}>Change Domain</button>
                <span
                  title={THEME_LABELS[theme]}
                  onClick={toggleTheme}
                  style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                >{THEME_ICONS[theme]}</span>
                <span className="metric-icon" title="Settings" onClick={() => setPage('settings')} style={{ cursor: 'pointer' }}>⚙</span>
                <span className="metric-icon" title="Notifications" onClick={() => setPage('notifications')} style={{ cursor: 'pointer' }}>🔔</span>
              </div>
            </div>
            <Page navigate={setPage} domain={domain} />
          </>
        )}
      </main>
    </div>
  );
}
