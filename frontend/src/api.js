const BASE = '/api';
const REQUEST_TIMEOUT_MS = 15000;

function withTimeout(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timerId) };
}

async function get(path) {
  const { signal, clear } = withTimeout();
  try {
    const res = await fetch(`${BASE}${path}`, { signal });
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`API ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clear();
  }
}

async function post(path, body) {
  const { signal, clear } = withTimeout();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`API POST ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clear();
  }
}

export const api = {
  getDomains:           ()             => get('/domains'),
  getKpis:              (domain)       => get(`/kpis?domain=${domain ?? 'telecom'}`),
  getOverviewAnalytics: (domain)       => get(`/overview-analytics?domain=${domain ?? 'telecom'}`),
  getModelPerformance:  (domain)       => get(`/model-performance?domain=${domain ?? 'telecom'}`),
  getModelComparison:   (domain)       => get(`/model-comparison?domain=${domain ?? 'telecom'}`),
  getFeatureImportance: (domain)       => get(`/feature-importance?domain=${domain ?? 'telecom'}`),
  getRiskRanking:       (domain)       => get(`/risk-ranking?domain=${domain ?? 'telecom'}`),
  getRetentionPlaybook: (domain)       => get(`/retention-playbook?domain=${domain ?? 'telecom'}`),
  optimizeRetentionPortfolio: (body, domain) => post('/optimize-retention-portfolio', { ...body, domain: domain ?? 'telecom' }),
  roiSimulation:        (body, domain) => post('/roi-simulation', { ...body, domain: domain ?? 'telecom' }),
  abTest:               (body, domain) => post('/ab-test',        { ...body, domain: domain ?? 'telecom' }),
};

/** Downsample an array to at most `n` evenly-spaced elements. */
export function subsample(arr, n = 120) {
  if (!arr || arr.length <= n) return arr;
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

/** Zip two arrays into recharts-ready [{x, y}] points. */
export function zipXY(xs, ys, n = 120) {
  const sxs = subsample(xs, n);
  const sys = subsample(ys, n);
  return sxs.map((x, i) => ({ x: +x.toFixed(4), y: +sys[i].toFixed(4) }));
}
