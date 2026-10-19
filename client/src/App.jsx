import React from "react";
import { api } from "./api.js";
import Overview from "./views/Overview.jsx";
import Cycles from "./views/Cycles.jsx";
import Workers from "./views/Workers.jsx";
import Leads from "./views/Leads.jsx";
import Events from "./views/Events.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "cycles", label: "Cycles" },
  { id: "workers", label: "Workers" },
  { id: "leads", label: "Leads" },
  { id: "events", label: "Events" },
];

export default function App() {
  const [tab, setTab] = React.useState("overview");
  const [dbOk, setDbOk] = React.useState(null);

  React.useEffect(() => {
    api.health().then((h) => setDbOk(!!h.db)).catch(() => setDbOk(false));
  }, []);

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Supervisor pipeline dashboard</h1>
          <div className="sub">
            Job-hunt supervisor observability · Neon Postgres ·{" "}
            {dbOk === null ? "checking…" : dbOk ? "database connected" : "database unreachable"}
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "overview" && <Overview onOpenCycle={() => setTab("cycles")} />}
      {tab === "cycles" && <Cycles />}
      {tab === "workers" && <Workers />}
      {tab === "leads" && <Leads />}
      {tab === "events" && <Events />}
    </div>
  );
}
