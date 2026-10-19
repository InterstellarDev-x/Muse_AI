#!/usr/bin/env node
/** Supervisor observability API — Express + Neon HTTP API, reads from Neon Postgres.
 *
 *  Config: DATABASE_URL in a local .env (gitignored). Never commit it.
 *  All queries are parameterised. Read-only: no INSERT/UPDATE/DELETE routes.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { q, endpointHost } = require("./db");

const PORT = process.env.PORT || 3001;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// ---- helpers ---------------------------------------------------------------
// q() is imported from ./db.js — parameterised queries only.

function intParam(v, def, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0) return def;
  return Math.min(n, max);
}

function likeParam(v) {
  return v ? `%${v}%` : null;
}

// ---- routes ----------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    const rows = await q("select 1 as ok");
    res.json({ ok: true, db: rows[0].ok === 1 || rows[0].ok === "1" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Filter options for dropdowns.
app.get("/api/meta", async (req, res) => {
  try {
    const [actors, events, statuses, sources, cycles] = await Promise.all([
      q("select distinct actor from trace_events order by 1"),
      q("select distinct event from trace_events order by 1"),
      q("select distinct status from leads order by 1"),
      q("select distinct source from leads where source is not null order by 1"),
      q("select cycle_id, started_at from supervisor_cycles order by started_at desc"),
    ]);
    res.json({
      actors: actors.map((r) => r.actor),
      events: events.map((r) => r.event),
      leadStatuses: statuses.map((r) => r.status),
      leadSources: sources.map((r) => r.source),
      cycles: cycles.map((r) => r.cycle_id),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Overview aggregates for the landing view.
app.get("/api/overview", async (req, res) => {
  try {
    const [totals, leadsByStatus, eventsByActor, eventsByType, snapshot, recent] =
      await Promise.all([
        q(`select (select count(*) from supervisor_cycles) as cycles,
                  (select count(*) from trace_events) as events,
                  (select count(*) from worker_runs) as worker_runs,
                  (select count(*) from leads) as leads`),
        q(`select status, count(*) as count from leads group by status order by count desc`),
        q(`select actor, count(*) as count from trace_events group by actor order by count desc`),
        q(`select event, count(*) as count from trace_events group by event order by count desc`),
        q(`select * from pipeline_snapshots order by ts desc limit 1`),
        q(`select id, ts, cycle_id, actor, event, detail
           from trace_events order by ts desc limit 15`),
      ]);
    res.json({
      totals: totals[0],
      leadsByStatus,
      eventsByActor,
      eventsByType,
      latestSnapshot: snapshot[0] || null,
      recentEvents: recent,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cycles with per-cycle counts.
app.get("/api/cycles", async (req, res) => {
  try {
    const rows = await q(
      `select c.cycle_id, c.started_at, c.finished_at, c.status, c.summary,
              (select count(*) from trace_events e where e.cycle_id = c.cycle_id) as event_count,
              (select count(*) from worker_runs w where w.cycle_id = c.cycle_id) as worker_count,
              (select count(*) from leads l where l.cycle_id = c.cycle_id) as lead_count
       from supervisor_cycles c
       order by c.started_at desc`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// One cycle: header + its worker runs + its events + its leads.
app.get("/api/cycles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [cycle, workers, events, leads] = await Promise.all([
      q(`select c.cycle_id, c.started_at, c.finished_at, c.status, c.summary,
                (select count(*) from trace_events e where e.cycle_id = c.cycle_id) as event_count
         from supervisor_cycles c where c.cycle_id = $1`, [id]),
      q(`select * from worker_runs where cycle_id = $1 order by started_at nulls last, id`, [id]),
      q(`select id, ts, actor, event, detail from trace_events
         where cycle_id = $1 order by ts, id limit 1000`, [id]),
      q(`select * from leads where cycle_id = $1 order by updated_at desc`, [id]),
    ]);
    if (!cycle.length) return res.status(404).json({ error: "cycle not found" });
    res.json({ cycle: cycle[0], workers, events, leads });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Event stream with filters + pagination.
app.get("/api/events", async (req, res) => {
  try {
    const limit = intParam(req.query.limit, 50, 500);
    const offset = intParam(req.query.offset, 0, 100000);
    const conds = [];
    const params = [];
    const add = (sql, v) => { params.push(v); conds.push(`${sql} $${params.length}`); };
    if (req.query.actor) add("actor =", req.query.actor);
    if (req.query.event) add("event =", req.query.event);
    if (req.query.cycle_id) add("cycle_id =", req.query.cycle_id);
    if (req.query.q) add("detail::text ilike", likeParam(req.query.q));
    const where = conds.length ? `where ${conds.join(" and ")}` : "";
    const [rows, total] = await Promise.all([
      q(`select id, ts, cycle_id, actor, event, detail from trace_events
         ${where} order by ts desc, id desc limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, offset]),
      q(`select count(*) as count from trace_events ${where}`, params),
    ]);
    res.json({ events: rows, total: parseInt(total[0].count, 10), limit, offset });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Worker runs with filters.
app.get("/api/workers", async (req, res) => {
  try {
    const conds = [];
    const params = [];
    const add = (sql, v) => { params.push(v); conds.push(`${sql} $${params.length}`); };
    if (req.query.cycle_id) add("cycle_id =", req.query.cycle_id);
    if (req.query.worker) add("worker =", req.query.worker);
    if (req.query.status) add("status =", req.query.status);
    const where = conds.length ? `where ${conds.join(" and ")}` : "";
    const rows = await q(
      `select * from worker_runs ${where} order by started_at desc nulls last, id desc limit 500`,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Leads with filters + search.
app.get("/api/leads", async (req, res) => {
  try {
    const limit = intParam(req.query.limit, 100, 500);
    const conds = [];
    const params = [];
    const add = (sql, v) => { params.push(v); conds.push(`${sql} $${params.length}`); };
    if (req.query.status) add("status =", req.query.status);
    if (req.query.source) add("source =", req.query.source);
    if (req.query.cycle_id) add("cycle_id =", req.query.cycle_id);
    if (req.query.q) {
      params.push(likeParam(req.query.q));
      conds.push(`(company ilike $${params.length} or role ilike $${params.length} or location ilike $${params.length})`);
    }
    const where = conds.length ? `where ${conds.join(" and ")}` : "";
    const [rows, total] = await Promise.all([
      q(`select * from leads ${where} order by updated_at desc limit $${params.length + 1}`,
        [...params, limit]),
      q(`select count(*) as count from leads ${where}`, params),
    ]);
    res.json({ leads: rows, total: parseInt(total[0].count, 10) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Pipeline snapshots over time.
app.get("/api/snapshots", async (req, res) => {
  try {
    const rows = await q(`select * from pipeline_snapshots order by ts limit 500`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`supervisor-dashboard API on http://localhost:${PORT} (Neon host: ${endpointHost()})`);
});
