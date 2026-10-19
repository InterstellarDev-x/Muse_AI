import React from "react";
import { api } from "../api.js";
import { Pill, Loading, ErrorBox, useFetch, fmtTs } from "../components/common.jsx";

export default function Leads() {
  const { data: meta } = useFetch(() => api.meta(), []);
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [q, setQ] = React.useState("");
  const [qLive, setQLive] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setQ(qLive), 350);
    return () => clearTimeout(t);
  }, [qLive]);

  const { data, error, loading } = useFetch(
    () => api.leads({ status, source, q }), [status, source, q]);

  return (
    <div>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {(meta?.leadStatuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          {(meta?.leadSources || []).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          placeholder="Search company, role, location…"
          value={qLive} onChange={(e) => setQLive(e.target.value)} />
      </div>
      {loading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="card">
          <h3>Leads ({data.total})</h3>
          <table className="data">
            <thead>
              <tr><th>Company</th><th>Role</th><th>Location</th><th>Source</th>
                  <th>Status</th><th>Reason</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {data.leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.link
                      ? <a href={l.link} target="_blank" rel="noreferrer">{l.company}</a>
                      : l.company}
                  </td>
                  <td>{l.role}</td>
                  <td className="small muted">{l.location || "—"}</td>
                  <td className="small">{l.source || "—"}</td>
                  <td><Pill value={l.status} /></td>
                  <td className="small muted">{l.reason || "—"}</td>
                  <td className="small muted" style={{ whiteSpace: "nowrap" }}>{fmtTs(l.updated_at)}</td>
                </tr>
              ))}
              {data.leads.length === 0 && <tr><td colSpan={7} className="muted">No leads match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
