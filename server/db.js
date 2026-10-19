/** Minimal Neon client over the serverless HTTP API (no extra deps).
 *
 *  Speaks the same protocol as @neondatabase/serverless in HTTP mode:
 *    POST https://<endpoint-host>/sql
 *    Headers: Neon-Connection-String, Neon-Raw-Text-Output, Neon-Array-Mode
 *    Body: {"query": "...", "params": [...]}
 *
 *  Why HTTP instead of a direct pg connection: it works everywhere plain
 *  HTTPS does, with no native modules or TLS edge cases. Parameterised
 *  queries use the usual $1, $2 placeholders.
 *
 *  Config: DATABASE_URL in a local .env (gitignored). Never commit it.
 *  Note: with Neon-Raw-Text-Output, every value comes back as a string —
 *  callers should coerce numbers where needed.
 */
const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Neon-Raw-Text-Output": "true",
  "Neon-Array-Mode": "true",
};

let cachedHost = null;

function endpointHost() {
  if (!cachedHost) {
    const dsn = process.env.DATABASE_URL || "";
    const m = dsn.match(/@([^/:?#]+)/);
    if (!m) throw new Error("Could not parse a hostname from DATABASE_URL");
    cachedHost = m[1];
  }
  return cachedHost;
}

async function q(text, params = []) {
  const host = endpointHost();
  const res = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: { ...BASE_HEADERS, "Neon-Connection-String": process.env.DATABASE_URL },
    body: JSON.stringify({ query: text, params }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Neon request failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  const fields = (data.fields || []).map((f) => f.name);
  return (data.rows || []).map((row) =>
    Object.fromEntries(row.map((v, i) => [fields[i], v]))
  );
}

module.exports = { q, endpointHost };
