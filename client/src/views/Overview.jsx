import React from "react";
import { api } from "../api.js";
import { StatCard, BarList, Pill, Loading, ErrorBox, useFetch, fmtTs } from "../components/common.jsx";

export default function Overview({ onOpenCycle }) {
  const { data, error, loading } = useFetch(() => api.overview(), []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const t = data.totals;
  const snap = data.latestSnapshot;

  return (
    <div>
      <div className="grid cols-4">
        <StatCard label="Supervisor cycles" value={Number(t.cycles).toLocaleString("en-GB")} />
        <StatCard label="Trace events" value={Number(t.events).toLocaleString("en-GB")} />
        <StatCard label="Worker runs" value={Number(t.worker_runs).toLocaleString("en-GB")} />
        <StatCard label="Leads tracked" value={Number(t.leads).toLocaleString("en-GB")} />
      </div>

      {snap && (
        <div className="card mt">
          <h3>Application pipeline snapshot <span className="muted">· {fmtTs(snap.ts)}</span></h3>
          <div className="grid cols-4">
            <StatCard label="Submitted" value={snap.submitted ?? "—"} />
            <StatCard label="Parked" value={snap.parked ?? "—"} />
            <StatCard label="Remaining" value={snap.remaining ?? "—"} />
            <StatCard label="Total pipeline" value={(snap.submitted ?? 0) + (snap.parked ?? 0) + (snap.remaining ?? 0)} />
          </div>
        </div>
      )}

      <div className="grid cols-2 mt">
        <div className="card">
          <h3>Leads by status</h3>
          <BarList items={data.leadsByStatus} labelKey="status" />
        </div>
        <div className="card">
          <h3>Events by actor</h3>
          <BarList items={data.eventsByActor} labelKey="actor" />
        </div>
      </div>

      <div className="grid cols-2 mt">
        <div className="card">
          <h3>Events by type</h3>
          <BarList items={data.eventsByType} labelKey="event" />
        </div>
        <div className="card">
          <h3>Latest activity</h3>
          <table className="data">
            <thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Cycle</th></tr></thead>
            <tbody>
              {data.recentEvents.map((e) => (
                <tr key={e.id}>
                  <td className="muted small" style={{ whiteSpace: "nowrap" }}>{fmtTs(e.ts)}</td>
                  <td>{e.actor}</td>
                  <td><Pill value={e.event} /></td>
                  <td>
                    <button className="back" style={{ margin: 0 }} onClick={() => onOpenCycle(e.cycle_id)}>
                      {e.cycle_id}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
