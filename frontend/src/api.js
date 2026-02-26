const BASE = '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  getKpis:              () => get('/kpis'),
  getModelPerformance:  () => get('/model-performance'),
  getModelComparison:   () => get('/model-comparison'),
  getFeatureImportance: () => get('/feature-importance'),
  getRiskRanking:       () => get('/risk-ranking'),
  getRetentionPlaybook: () => get('/retention-playbook'),
  roiSimulation:        (body) => post('/roi-simulation', body),
  abTest:               (body) => post('/ab-test', body),
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
