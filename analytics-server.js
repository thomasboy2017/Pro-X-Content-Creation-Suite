// Studio Editor usage-statistics collector. No dependencies: run with  node analytics-server.js
//   PORT=8787  ADMIN_KEY=choose-a-long-secret  ALLOW_ORIGIN=https://your-site.com  DATA=events.jsonl
// The editor posts to  http(s)://your-host/collect   and you read results at  /dashboard?key=ADMIN_KEY
// IP addresses are not stored. Put this behind HTTPS (a reverse proxy such as Caddy or nginx).
const http = require("http"), fs = require("fs");
const PORT = +process.env.PORT || 8787, FILE = process.env.DATA || "events.jsonl", KEY = process.env.ADMIN_KEY || "", ORIGIN = process.env.ALLOW_ORIGIN || "*";

const sessions = new Map();   // sid -> summary
const hex = (s) => typeof s === "string" && /^[0-9a-f]{32}$/.test(s);
const str = (s, n = 120) => (typeof s === "string" ? s.replace(/[\u0000-\u001f<>]/g, "").slice(0, n) : "");
const num = (x, max) => (Number.isFinite(+x) ? Math.max(0, Math.min(max, +x)) : 0);

function apply(e) {
  let s = sessions.get(e.sid);
  if (!s) { s = { uid: e.uid, first: e.t, last: e.t, active: 0, wall: 0, hw: null, embed: !!e.embed, app: e.app || "" }; sessions.set(e.sid, s); }
  s.last = Math.max(s.last, e.t);
  if (e.type === "start" && e.hw) s.hw = e.hw;
  if (e.active !== undefined) s.active = Math.max(s.active, e.active);
  if (e.wall !== undefined) s.wall = Math.max(s.wall, e.wall);
}
function clean(b, now) {
  if (!b || b.v !== 1 || !["start", "beat", "end"].includes(b.type) || !hex(b.uid) || !hex(b.sid)) return null;
  const e = { t: now, type: b.type, uid: b.uid, sid: b.sid, app: str(b.app, 12), embed: !!b.embed };
  if (b.type === "start" && b.hw && typeof b.hw === "object") {
    const h = b.hw;
    e.hw = { browser: str(h.browser, 40), os: str(h.os, 30), cores: num(h.cores, 512), ram: num(h.ram, 1024), screen: str(h.screen, 16), dpr: num(h.dpr, 10), touch: !!h.touch, gpu: str(h.gpu), gpuInfo: str(h.gpuInfo), webgpu: !!h.webgpu, webcodecs: !!h.webcodecs, renderer: str(h.renderer, 20) };
  } else { e.active = num(b.active, 86400 * 3); e.wall = num(b.wall, 86400 * 3); }
  return e;
}
if (fs.existsSync(FILE)) for (const l of fs.readFileSync(FILE, "utf8").split("\n")) { if (l) try { apply(JSON.parse(l)); } catch {} }

function top(map, n = 12) { return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); }
function stats() {
  const now = Date.now(), all = [...sessions.values()], users = new Set(all.map((s) => s.uid));
  const win = (ms) => { const r = all.filter((s) => now - s.last < ms); return { users: new Set(r.map((s) => s.uid)).size, sessions: r.length }; };
  const act = all.map((s) => s.active).sort((a, b) => a - b), sum = act.reduce((a, b) => a + b, 0);
  const tally = (f) => { const m = new Map(); for (const s of all) if (s.hw) { const k = f(s.hw) || "unknown"; m.set(k, (m.get(k) || 0) + 1); } return top(m); };
  const bucket = (n, edges) => { for (const e of edges) if (n <= e) return "≤" + e; return ">" + edges[edges.length - 1]; };
  return {
    users: users.size, sessions: all.length, last24h: win(864e5), last7d: win(6048e5), last30d: win(2592e6),
    avgActiveMinutes: all.length ? +(sum / all.length / 60).toFixed(1) : 0, medianActiveMinutes: act.length ? +(act[act.length >> 1] / 60).toFixed(1) : 0, totalActiveHours: +(sum / 3600).toFixed(1),
    embedShare: all.length ? +(all.filter((s) => s.embed).length / all.length).toFixed(2) : 0,
    hardware: { browser: tally((h) => h.browser), os: tally((h) => h.os), gpu: tally((h) => h.gpuInfo || h.gpu), cpuCores: tally((h) => bucket(h.cores, [2, 4, 6, 8, 12, 16, 32])), memoryGB: tally((h) => (h.ram ? bucket(h.ram, [2, 4, 8]) : "unreported")), screen: tally((h) => h.screen), renderer: tally((h) => h.renderer), webgpu: tally((h) => (h.webgpu ? "yes" : "no")), webcodecs: tally((h) => (h.webcodecs ? "yes" : "no")) }
  };
}
const rate = new Map(); setInterval(() => rate.clear(), 60000).unref();
const cors = { "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  if (req.method === "POST" && url.pathname === "/collect") {
    const ip = req.socket.remoteAddress, n = (rate.get(ip) || 0) + 1; rate.set(ip, n);
    if (n > 240) { res.writeHead(429, cors); return res.end(); }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on("end", () => {
      try { const e = clean(JSON.parse(body), Date.now()); if (e) { apply(e); fs.appendFile(FILE, JSON.stringify(e) + "\n", () => {}); } } catch {}
      res.writeHead(204, cors); res.end();
    });
    return;
  }
  if (req.method === "GET" && (url.pathname === "/stats" || url.pathname === "/dashboard")) {
    if (!KEY || url.searchParams.get("key") !== KEY) { res.writeHead(403); return res.end("Set ADMIN_KEY and pass ?key=…"); }
    const s = stats();
    if (url.pathname === "/stats") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(s, null, 2)); }
    const tbl = (t, rows) => `<h3>${t}</h3><table>${rows.map(([k, v]) => `<tr><td>${String(k).replace(/[<>&]/g, "")}</td><td>${v}</td></tr>`).join("")}</table>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(`<!doctype html><meta charset=utf-8><title>Studio Editor stats</title><style>body{font:14px system-ui;margin:24px;max-width:900px}table{border-collapse:collapse;margin-bottom:12px}td{border:1px solid #ccc;padding:3px 10px}</style>
<h2>Studio Editor usage</h2>${tbl("Visitors", [["Unique users (all time)", s.users], ["Sessions", s.sessions], ["Users, last 24 h", s.last24h.users], ["Users, last 7 days", s.last7d.users], ["Users, last 30 days", s.last30d.users], ["Average active minutes per session", s.avgActiveMinutes], ["Median active minutes", s.medianActiveMinutes], ["Total active hours", s.totalActiveHours], ["Share used inside an embed", s.embedShare]])}
${Object.entries(s.hardware).map(([k, v]) => tbl(k, v)).join("")}`);
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log("Studio Editor stats collector on port " + PORT));
