import React from "react";
import { api } from "../api.js";
import { Pill, Loading, ErrorBox, useFetch, fmtTs, fmtDur } from "../components/common.jsx";

const WORKERS = ["linkedin-scout", "reddit-scout", "portal-crawler", "opportunity-researcher", "supervisor"];

export default function Workers() {
  const [worker, setWorker] = React.useState("");
  const [status, setStatus] = React.useState("");
  const { data, error, loading } = useFetch(
    () => api.workers({ worker, status }), [worker, status]);

  return (
    <div>
      <div className="filters">
        <select value={worker} onChange={(e) => setWorker(e.target.value)}>
          <option value="">All workers</option>
          {WORKERS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["spawned", "completed", "failed", "reassigned"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="card">
          <h3>Worker runs ({data.length})</h3>
          <table className="data">
            <thead>
              <tr><th>Worker</th><th>Cycle</th><th>Status</th><th>Started</th>
                  <th>Finished</th><th>Duration</th><th>Note</th></tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id}>
                  <td>{w.worker}</td>
                  <td className="mono small">{w.cycle_id}</td>
                  <td><Pill value={w.status} /></td>
                  <td className="small">{fmtTs(w.started_at)}</td>
                  <td className="small">{fmtTs(w.finished_at)}</td>
                  <td className="small">
                    {w.started_at && w.finished_at
                      ? fmtDur(new Date(w.finished_at) - new Date(w.started_at)) : "—"}
                  </td>
                  <td className="small muted">{w.note || "—"}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} className="muted">No runs match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
