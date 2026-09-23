// CaveWork · Ranking mundial
//
//   GET  /top[?liga=K7P2Q]  → { size, top:[…50], semana:[…10], campeon, semanaInicio,
//                               dia, hoy:[…10 del reto diario], ayer:{ganador del reto de ayer}, liga:[…20 de esa liga] }
//   POST /partida  { modo: "normal" | "diario" } → { runId, dia }   (al empezar cada partida)
//   POST /score    { runId, name, score, level, liga? } → { …/top, puesto, puestoSemana, puestoHoy, codigo }
//   GET  /export   → todas las marcas guardadas (para las copias de seguridad; sin códigos de premio)
//
// - La semana empieza el lunes a las 00:00 UTC. «campeon» es el mejor de la semana anterior.
// - El reto diario cambia a las 00:00 de Mallorca (Europe/Madrid). Tiene su propio ranking («hoy»).
// - Ligas: un código de 5 letras que comparten unos amigos; cada marca puede llevar la liga del jugador.
// - Cada marca guarda un «codigo» de premio que solo recibe quien la hizo: si es campeón de la semana,
//   lo enseña para reclamar el premio. El vigilante lo lee por el entrypoint privado (Privado.campeon),
//   que no se puede llamar desde internet.
//
// Antitrampas sencillo: cada puntuación necesita una partida empezada de verdad (runId de un solo uso),
// y los puntos tienen que ser posibles para el tiempo que ha durado la partida.
// La primera vez copia el Top 10 de la API antigua (cavework-api) para no perder ninguna marca.

import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";

const TAM = 50;
const TAM_SEMANA = 10;
const TAM_HOY = 10;
const TAM_LIGA = 20;
const DIA = 86400e3;

// Lunes 00:00 UTC de la semana de `t`.
function inicioSemana(t = Date.now()) {
  const d = new Date(t);
  const dow = (d.getUTCDay() + 6) % 7;   // 0 = lunes
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dow * DIA;
}
// Día del reto diario (en Mallorca): "2026-09-23".
const diaDe = (t = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(t));

const API_ANTIGUA = "https://cavework-api.arnoldwork.workers.dev/state";
const ORIGENES = [
  /^https:\/\/heavywork\.arnoldwork\.com$/,
  /^https:\/\/[a-z0-9-]+-heavywork\.arnoldwork\.workers\.dev$/,   // vistas previas
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,                   // pruebas en local
];
const BLOQUEADOS = ["ASS","FUK","FCK","FUC","SEX","KKK","NAZ","CUM","DIK","DIC","TIT","PIS","FAG","NIG","GAY","WTF","XXX","PUT","PTA","CUL","MRD","POL","PEN","VAG","ANO","JOD","HDP","KYS"];
const nombreOk = n => typeof n === "string" && /^[A-Z]{3}$/.test(n) && !BLOQUEADOS.includes(n);
const ligaOk = l => typeof l === "string" && /^[A-HJ-NP-Z2-9]{5}$/.test(l);
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin 0/O ni 1/I para que no se confundan
const codigoNuevo = () => [...crypto.getRandomValues(new Uint8Array(6))].map(b => ALFABETO[b % ALFABETO.length]).join("");

const PUNTOS_POR_SEGUNDO = 1500;   // muy por encima de lo que se consigue jugando: solo frena lo imposible
const PARTIDA_MAX_MS = 3 * 3600e3;  // una partida vale 3 horas como mucho
const CAMPOS = "name, score, level, date";

export class Ranking extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS marcas (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, date INTEGER NOT NULL)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS marcas_score ON marcas(score DESC)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS partidas (id TEXT PRIMARY KEY, inicio INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS ajustes (k TEXT PRIMARY KEY, v TEXT)`);
    // Columnas nuevas (las marcas antiguas quedan como modo «normal», sin liga).
    for (const q of [
      `ALTER TABLE marcas ADD COLUMN modo TEXT NOT NULL DEFAULT 'normal'`,
      `ALTER TABLE marcas ADD COLUMN dia TEXT`,
      `ALTER TABLE marcas ADD COLUMN liga TEXT`,
      `ALTER TABLE marcas ADD COLUMN codigo TEXT`,
      `ALTER TABLE partidas ADD COLUMN modo TEXT NOT NULL DEFAULT 'normal'`,
      `ALTER TABLE partidas ADD COLUMN dia TEXT`,
    ]) { try { this.sql.exec(q); } catch { /* ya existe */ } }
    this.sql.exec(`CREATE INDEX IF NOT EXISTS marcas_dia ON marcas(modo, dia, score DESC)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS marcas_liga ON marcas(liga, score DESC)`);
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
    return this.sql.exec(`SELECT ${CAMPOS} FROM marcas WHERE modo = 'normal' ORDER BY score DESC, date ASC LIMIT ?`, TAM).toArray();
  }

  entre(desde, hasta, n, campos = CAMPOS) {
    return this.sql.exec(`SELECT ${campos} FROM marcas WHERE modo = 'normal' AND date >= ? AND date < ? ORDER BY score DESC, date ASC LIMIT ?`, desde, hasta, n).toArray();
  }

  hoy(dia = diaDe()) {
    return this.sql.exec(`SELECT ${CAMPOS} FROM marcas WHERE modo = 'diario' AND dia = ? ORDER BY score DESC, date ASC LIMIT ?`, dia, TAM_HOY).toArray();
  }

  liga(l) {
    return ligaOk(l) ? this.sql.exec(`SELECT ${CAMPOS} FROM marcas WHERE modo = 'normal' AND liga = ? ORDER BY score DESC, date ASC LIMIT ?`, l, TAM_LIGA).toArray() : [];
  }

  datos(liga) {
    const ini = inicioSemana();
    const d = {
      size: TAM, sizeSemana: TAM_SEMANA, sizeHoy: TAM_HOY, sizeLiga: TAM_LIGA, semanaInicio: ini, dia: diaDe(),
      top: this.top(),
      semana: this.entre(ini, Infinity, TAM_SEMANA),
      campeon: this.entre(ini - 7 * DIA, ini, 1)[0] || null,
      hoy: this.hoy(),
      ayer: this.hoy(diaDe(Date.now() - DIA))[0] || null,   // ganador del reto diario de ayer
    };
    if (ligaOk(liga)) d.liga = this.liga(liga);
    return d;
  }

  async verTop(liga) {
    await this.importar();
    return this.datos(liga);
  }

  // Para el vigilante: el campeón de la semana pasada con su código de premio.
  campeonConCodigo() {
    const ini = inicioSemana();
    return this.entre(ini - 7 * DIA, ini, 1, `${CAMPOS}, codigo`)[0] || null;
  }

  exportar() {
    return { exportado: Date.now(), marcas: this.sql.exec(`SELECT ${CAMPOS}, modo, dia, liga FROM marcas ORDER BY score DESC`).toArray() };
  }

  partida(modo) {
    const ahora = Date.now();
    modo = modo === "diario" ? "diario" : "normal";
    this.sql.exec(`DELETE FROM partidas WHERE inicio < ?`, ahora - PARTIDA_MAX_MS);
    const id = crypto.randomUUID(), dia = diaDe(ahora);
    this.sql.exec(`INSERT INTO partidas (id, inicio, modo, dia) VALUES (?, ?, ?, ?)`, id, ahora, modo, dia);
    return { runId: id, modo, dia };
  }

  async guardar({ runId, name, score, level, liga }) {
    await this.importar();
    if (!nombreOk(name)) return { error: "Nombre no válido", status: 400 };
    score = Math.floor(Number(score)); level = Math.floor(Number(level)) || 1;
    if (!Number.isFinite(score) || score <= 0 || score > 10_000_000 || level < 1 || level > 999) return { error: "Puntuación no válida", status: 400 };
    const p = typeof runId === "string" ? this.sql.exec(`SELECT inicio, modo, dia FROM partidas WHERE id = ?`, runId).toArray()[0] : null;
    if (!p) return { error: "Partida no encontrada", status: 400 };
    this.sql.exec(`DELETE FROM partidas WHERE id = ?`, runId);    // un solo uso
    const segundos = (Date.now() - p.inicio) / 1000;
    if (score > 3000 + segundos * PUNTOS_POR_SEGUNDO) return { error: "Puntuación imposible", status: 400 };
    const ahora = Date.now(), codigo = codigoNuevo();
    const l = p.modo === "normal" && ligaOk(liga) ? liga : null;
    this.sql.exec(`INSERT INTO marcas (name, score, level, date, modo, dia, liga, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      name, score, level, ahora, p.modo, p.dia || diaDe(ahora), l, codigo);
    // Guarda las 500 mejores de siempre, todo lo de las dos últimas semanas y las marcas de ligas.
    this.sql.exec(`DELETE FROM marcas WHERE date < ? AND liga IS NULL AND id NOT IN (SELECT id FROM marcas WHERE modo = 'normal' ORDER BY score DESC, date ASC LIMIT 500)`, inicioSemana() - 8 * DIA);
    const cuenta = (q, ...a) => this.sql.exec(q, ...a).one().n + 1;
    const res = { ...this.datos(l || liga), modo: p.modo, codigo };
    if (p.modo === "diario") res.puestoHoy = cuenta(`SELECT COUNT(*) AS n FROM marcas WHERE modo = 'diario' AND dia = ? AND score > ?`, p.dia, score);
    else {
      res.puesto = cuenta(`SELECT COUNT(*) AS n FROM marcas WHERE modo = 'normal' AND score > ?`, score);
      res.puestoSemana = cuenta(`SELECT COUNT(*) AS n FROM marcas WHERE modo = 'normal' AND score > ? AND date >= ?`, score, inicioSemana());
    }
    return res;
  }
}

// Solo accesible desde otros Workers de la cuenta con un «service binding» (el vigilante), nunca desde internet.
export class Privado extends WorkerEntrypoint {
  async campeon() {
    return this.env.RANKING.get(this.env.RANKING.idFromName("mundial")).campeonConCodigo();
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
    const url = new URL(req.url), { pathname } = url;
    const r = env.RANKING.get(env.RANKING.idFromName("mundial"));
    try {
      if (req.method === "GET" && (pathname === "/top" || pathname === "/")) return json(req, await r.verTop(url.searchParams.get("liga")));
      if (req.method === "GET" && pathname === "/export") return json(req, await r.exportar());
      if (req.method === "POST" && pathname === "/partida") {
        const body = await req.json().catch(() => ({}));
        return json(req, await r.partida(body.modo));
      }
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
