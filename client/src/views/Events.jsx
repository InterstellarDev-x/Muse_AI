import React from "react";
import { api } from "../api.js";
import { Pill, Loading, ErrorBox, useFetch, DetailJson, fmtTs } from "../components/common.jsx";

const PAGE = 50;

export default function Events() {
  const { data: meta } = useFetch(() => api.meta(), []);
  const [actor, setActor] = React.useState("");
  const [event, setEvent] = React.useState("");
  const [cycleId, setCycleId] = React.useState("");
  const [q, setQ] = React.useState("");
  const [qLive, setQLive] = React.useState("");
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => { setQ(qLive); setOffset(0); }, 350);
    return () => clearTimeout(t);
  }, [qLive]);

  const resetPage = () => setOffset(0);
  const { data, error, loading } = useFetch(
    () => api.events({ actor, event, cycle_id: cycleId, q, limit: PAGE, offset }),
    [actor, event, cycleId, q, offset]);

  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const page = Math.floor(offset / PAGE) + 1;

  return (
    <div>
      <div className="filters">
        <select value={actor} onChange={(e) => { setActor(e.target.value); resetPage(); }}>
          <option value="">All actors</option>
          {(meta?.actors || []).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={event} onChange={(e) => { setEvent(e.target.value); resetPage(); }}>
          <option value="">All event types</option>
          {(meta?.events || []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={cycleId} onChange={(e) => { setCycleId(e.target.value); resetPage(); }}>
          <option value="">All cycles</option>
          {(meta?.cycles || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          placeholder="Search inside event detail…"
          value={qLive} onChange={(e) => setQLive(e.target.value)} />
      </div>

      {loading && <Loading />}
      {error && <ErrorBox error={error} />}

      {data && (
        <div className="card">
          <h3>Event stream ({total.toLocaleString("en-GB")})</h3>
          <div className="timeline">
            {data.events.map((e) => (
              <div className="tl-item" key={e.id}>
                <span className="tl-time">{fmtTs(e.ts)}<br /><span className="mono">{e.cycle_id}</span></span>
                <span className="tl-body">
                  <span className="actor">{e.actor}</span>
                  <span className="ev"><Pill value={e.event} /></span>
                  <DetailJson data={e.detail} />
                </span>
              </div>
            ))}
            {data.events.length === 0 && <div className="muted">No events match.</div>}
          </div>
          <div className="mt" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← newer</button>
            <span className="muted small">page {page} of {pages}</span>
            <button disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>older →</button>
          </div>
        </div>
      )}
    </div>
  );
}
