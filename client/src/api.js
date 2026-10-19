// API helpers. In dev, /api is proxied to localhost:3001 by vite.config.js.
// For production, set VITE_API_URL to the deployed backend origin.
const BASE = import.meta.env.VITE_API_URL || "";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => get("/api/health"),
  meta: () => get("/api/meta"),
  overview: () => get("/api/overview"),
  cycles: () => get("/api/cycles"),
  cycle: (id) => get(`/api/cycles/${encodeURIComponent(id)}`),
  events: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return get(`/api/events${qs ? `?${qs}` : ""}`);
  },
  workers: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return get(`/api/workers${qs ? `?${qs}` : ""}`);
  },
  leads: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return get(`/api/leads${qs ? `?${qs}` : ""}`);
  },
  snapshots: () => get("/api/snapshots"),
};
