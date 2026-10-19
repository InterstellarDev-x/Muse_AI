import React from "react";

export function fmtTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

export function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function fmtDur(ms) {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function Pill({ value }) {
  const v = String(value || "—");
  const cls = v.toLowerCase().replace(/[^a-z]/g, "");
  const known = ["found", "verified", "dropped", "parked", "submitted",
    "running", "spawned", "completed", "finished", "failed", "reassigned"];
  return <span className={`pill ${known.includes(cls) ? cls : "neutral"}`}>{v}</span>;
}

export function StatCard({ label, value }) {
  return (
    <div className="card stat">
      <span className="value">{value}</span>
      <span className="label">{label}</span>
    </div>
  );
}

export function BarList({ items, labelKey = "label", valueKey = "count", color }) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey]) || 0));
  return (
    <div>
      {items.map((i, idx) => (
        <div className="bar-row" key={idx}>
          <span className="lbl" title={i[labelKey]}>{i[labelKey]}</span>
          <span className="bar-track">
            <span
              className="bar-fill"
              style={{
                width: `${(Number(i[valueKey]) / max) * 100}%`,
                ...(color ? { background: color } : {}),
              }}
            />
          </span>
          <span className="num">{Number(i[valueKey]).toLocaleString("en-GB")}</span>
        </div>
      ))}
      {items.length === 0 && <div className="muted small">No data yet.</div>}
    </div>
  );
}

export function Loading() {
  return <div className="loading">Loading…</div>;
}

export function ErrorBox({ error }) {
  return <div className="error">Couldn't load data: {String(error?.message || error)}</div>;
}

export function useFetch(fn, deps = []) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading };
}

export function DetailJson({ data }) {
  const text = JSON.stringify(data, null, 2);
  if (!text || text === "{}" || text === "null") return null;
  return (
    <details className="tl-detail">
      <summary>detail</summary>
      <pre>{text}</pre>
    </details>
  );
}
