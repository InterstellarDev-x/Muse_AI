import React from "react";
import { api } from "../api.js";
import {
  Pill, Loading, ErrorBox, useFetch, DetailJson,
  fmtTs, fmtDur,
} from "../components/common.jsx";

export default function Cycles() {
  const { data: cycles, error, loading } = useFetch(() => api.cycles(), []);
  const [openId, setOpenId] = React.useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div>
      <div className="card">
        <h3>All cycles ({cycles.length})</h3>
        <table className="data">
          <thead>
            <tr>
              <th>Cycle</th><th>Started</th><th>Finished</th><th>Status</th>
              <th>Events</th><th>Workers</th><th>Leads</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.cycle_id} className="clickable" onClick={() =>
                setOpenId(openId === c.cycle_id ? null : c.cycle_id)}>
                <td className="mono">{c.cycle_id}</td>
                <td className="small">{fmtTs(c.started_at)}</td>
                <td className="small">{fmtTs(c.finished_at)}</td>
                <td><Pill value={c.status} /></td>
                <td>{c.event_count}</td>
                <td>{c.worker_count}</td>
                <td>{c.lead_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {openId && <CycleDetail key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function CycleDetail({ id, onClose }) {
  const { data, error, loading } = useFetch(() => api.cycle(id), [id]);

  return (
    <div className="card mt">
      <button className="back" onClick={onClose}>← close {id}</button>
      {loading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && (
        <div>
          <div className="grid cols-4">
            <div className="stat"><span className="value">{data.events.length}</span><span className="label">events</span></div>
            <div className="stat"><span className="value">{data.workers.length}</span><span className="label">worker runs</span></div>
            <div className="stat"><span className="value">{data.leads.length}</span><span className="label">leads touched</span></div>
            <div className="stat">
              <span className="value small">
                {data.cycle.started_at ? fmtDur(new Date(data.cycle.finished_at || Date.now()) - new Date(data.cycle.started_at)) : "—"}
              </span>
              <span className="label">duration</span>
            </div>
          </div>

          <h3 className="mt">Worker runs</h3>
          <table className="data">
            <thead><tr><th>Worker</th><th>Status</th><th>Started</th><th>Finished</th><th>Duration</th><th>Note</th></tr></thead>
            <tbody>
              {data.workers.map((w) => (
                <tr key={w.id}>
                  <td>{w.worker}</td>
                  <td><Pill value={w.status} /></td>
                  <td className="small">{fmtTs(w.started_at)}</td>
                  <td className="small">{fmtTs(w.finished_at)}</td>
                  <td className="small">{w.started_at && w.finished_at ? fmtDur(new Date(w.finished_at) - new Date(w.started_at)) : "—"}</td>
                  <td className="small muted">{w.note || "—"}</td>
                </tr>
              ))}
              {data.workers.length === 0 && <tr><td colSpan={6} className="muted">No worker runs recorded.</td></tr>}
            </tbody>
          </table>

          <h3 className="mt">Event timeline</h3>
          <div className="timeline">
            {data.events.map((e) => (
              <div className="tl-item" key={e.id}>
                <span className="tl-time">{fmtTs(e.ts)}</span>
                <span className="tl-body">
                  <span className="actor">{e.actor}</span>
                  <span className="ev"><Pill value={e.event} /></span>
                  <DetailJson data={e.detail} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
