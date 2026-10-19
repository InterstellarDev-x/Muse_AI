# Supervisor Pipeline Dashboard

React + Vite frontend, Node + Express backend, reading the job-hunt
supervisor's observability data live from Neon Postgres.

## What's inside

- **Overview** — totals (cycles, events, worker runs, leads), the latest
  application-pipeline snapshot (submitted / parked / remaining), leads by
  status, events by actor and type, latest activity.
- **Cycles** — every supervisor cycle with event/worker/lead counts; click a
  cycle for its worker runs and full event timeline (expandable detail JSON).
- **Workers** — all worker runs (linkedin-scout, reddit-scout,
  portal-crawler, opportunity-researcher) with status filter and durations.
- **Leads** — every lead the pipeline found, filterable by status, source,
  and free-text search; company names link to the posting.
- **Events** — the full trace stream with actor / event-type / cycle filters,
  detail search, and pagination.

## Run it

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# put your Neon connection string in .env as DATABASE_URL
# (Neon dashboard -> your project -> Connection Details)
npm run dev     # or: npm start
```

API runs on http://localhost:3001. `GET /api/health` should return
`{"ok":true,"db":true}`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs on http://localhost:5173. In dev, `/api` is proxied to the
backend, so no extra config is needed.

### Production

```bash
cd client && npm run build   # outputs to client/dist/
```

Serve `dist/` statically and point the frontend at the backend with
`VITE_API_URL` (e.g. `VITE_API_URL=https://api.example.com npm run build`).

## API reference

| Method | Endpoint | Notes |
|---|---|---|
| GET | /api/health | DB connectivity check |
| GET | /api/meta | distinct actors, event types, lead statuses/sources, cycles (for filters) |
| GET | /api/overview | totals, leads/events breakdowns, latest snapshot, 15 recent events |
| GET | /api/cycles | cycles with event/worker/lead counts |
| GET | /api/cycles/:id | cycle + its worker runs + events + leads |
| GET | /api/events | filters: `actor`, `event`, `cycle_id`, `q`; paging: `limit` (≤500), `offset` |
| GET | /api/workers | filters: `worker`, `status`, `cycle_id` |
| GET | /api/leads | filters: `status`, `source`, `cycle_id`, `q` (company/role/location) |
| GET | /api/snapshots | pipeline snapshots over time |

The API is read-only — no writes.

## How the backend talks to Neon

`server/db.js` uses Neon's serverless HTTP API (`POST https://<host>/sql`
with the connection string in the `Neon-Connection-String` header) instead
of a direct Postgres socket. Same protocol the supervisor's own
`neon_db.py` sync uses; works anywhere plain HTTPS does, no native modules.
