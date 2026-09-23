// CaveWork · Ranking mundial (Top 50)
//
//   GET  /top      → { size, top:[{name, score, level, date}] }
//   POST /partida  → { runId }                  (al empezar cada partida)
//   POST /score    { runId, name, score, level } → { top, puesto }
//
// Antitrampas sencillo: cada puntuación necesita una partida empezada de verdad (runId de un solo uso),
// y los puntos tienen que ser posibles para el tiempo que ha durado la partida.
// La primera vez copia el Top 10 de la API antigua (cavework-api) para no perder ninguna marca.

import { DurableObject } from "cloudflare:workers";

const TAM = 50;
const API_ANTIGUA = "https://cavework-api.arnoldwork.workers.dev/state";
const ORIGENES = [
  /^https:\/\/heavywork\.arnoldwork\.com$/,
  /^https:\/\/[a-z0-9-]+-heavywork\.arnoldwork\.workers\.dev$/,   // vistas previas
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,                   // pruebas en local
];
const BLOQUEADOS = ["ASS","FUK","FCK","FUC","SEX","KKK","NAZ","CUM","DIK","DIC","TIT","PIS","FAG","NIG","GAY","WTF","XXX","PUT","PTA","CUL","MRD","POL","PEN","VAG","ANO","JOD","HDP","KYS"];
const nombreOk = n => typeof n === "string" && /^[A-Z]{3}$/.test(n) && !BLOQUEADOS.includes(n);

const PUNTOS_POR_SEGUNDO = 1500;   // muy por encima de lo que se consigue jugando: solo frena lo imposible
const PARTIDA_MAX_MS = 3 * 3600e3;  // una partida vale 3 horas como mucho

export class Ranking extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS marcas (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, date INTEGER NOT NULL)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS marcas_score ON marcas(score DESC)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS partidas (id TEXT PRIMARY KEY, inicio INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS ajustes (k TEXT PRIMARY KEY, v TEXT)`);
  }

  async importar() {
    if (this.sql.exec(`SELECT v FROM ajustes WHERE k = 'importado'`).toArray().length) return;
    try {
      const r = await fetch(API_ANTIGUA, { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      for (const m of d.top || []) {
        if (nombreOk(m.name) && Number.isFinite(m.score) && m.score > 0)
          this.sql.exec(`INSERT INTO marcas (name, score, level, date) VALUES (?, ?, ?, ?)`, m.name, Math.floor(m.score), Math.max(1, Math.floor(m.level || 1)), m.date || Date.now());
      }
      this.sql.exec(`INSERT OR REPLACE INTO ajustes (k, v) VALUES ('importado', ?)`, String(Date.now()));
    } catch { /* se reintenta en la siguiente visita */ }
  }

  top() {
    return this.sql.exec(`SELECT name, score, level, date FROM marcas ORDER BY score DESC, date ASC LIMIT ?`, TAM).toArray();
  }

  async verTop() {
    await this.importar();
    return { size: TAM, top: this.top() };
  }

  partida() {
    const ahora = Date.now();
    this.sql.exec(`DELETE FROM partidas WHERE inicio < ?`, ahora - PARTIDA_MAX_MS);
    const id = crypto.randomUUID();
    this.sql.exec(`INSERT INTO partidas (id, inicio) VALUES (?, ?)`, id, ahora);
    return { runId: id };
  }

  async guardar({ runId, name, score, level }) {
    await this.importar();
    if (!nombreOk(name)) return { error: "Nombre no válido", status: 400 };
    score = Math.floor(Number(score)); level = Math.floor(Number(level)) || 1;
    if (!Number.isFinite(score) || score <= 0 || score > 10_000_000 || level < 1 || level > 999) return { error: "Puntuación no válida", status: 400 };
    const p = typeof runId === "string" ? this.sql.exec(`SELECT inicio FROM partidas WHERE id = ?`, runId).toArray()[0] : null;
    if (!p) return { error: "Partida no encontrada", status: 400 };
    this.sql.exec(`DELETE FROM partidas WHERE id = ?`, runId);    // un solo uso
    const segundos = (Date.now() - p.inicio) / 1000;
    if (score > 3000 + segundos * PUNTOS_POR_SEGUNDO) return { error: "Puntuación imposible", status: 400 };
    this.sql.exec(`INSERT INTO marcas (name, score, level, date) VALUES (?, ?, ?, ?)`, name, score, level, Date.now());
    // Guarda de sobra (500) por si algún día se amplía, y borra el resto.
    this.sql.exec(`DELETE FROM marcas WHERE id NOT IN (SELECT id FROM marcas ORDER BY score DESC, date ASC LIMIT 500)`);
    const puesto = this.sql.exec(`SELECT COUNT(*) AS n FROM marcas WHERE score > ?`, score).one().n + 1;
    return { top: this.top(), puesto, size: TAM };
  }
}

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const h = { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
  if (ORIGENES.some(r => r.test(o))) h["Access-Control-Allow-Origin"] = o;
  return h;
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(req) } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const { pathname } = new URL(req.url);
    const r = env.RANKING.get(env.RANKING.idFromName("mundial"));
    try {
      if (req.method === "GET" && (pathname === "/top" || pathname === "/")) return json(req, await r.verTop());
      if (req.method === "POST" && pathname === "/partida") return json(req, await r.partida());
      if (req.method === "POST" && pathname === "/score") {
        const body = await req.json().catch(() => ({}));
        const d = await r.guardar(body);
        return d.error ? json(req, { error: d.error }, d.status) : json(req, d);
      }
      return json(req, { error: "Not found" }, 404);
    } catch (e) {
      return json(req, { error: "Error interno" }, 500);
    }
  },
};
