// ArnoldWork · Vigilante y automatismos
//
// Cada 30 minutos:  comprueba que las webs y las APIs respondan (y que no vayan lentas),
//                   avisa por Telegram si algo se cae o vuelve, y si hay un nuevo nº 1 en CaveWork.
// Cada mañana:      resumen «todo OK» (o lo que falle) y aviso si el dominio está a punto de caducar.
// Cada lunes:       resumen de la semana (ventas, contactos, partidas, campeón, incidencias)
//                   y copia de seguridad del ranking y de los contactos, enviada por Telegram.
// En cualquier momento:
//   POST /kofi      Ko-fi avisa de cada venta o batido → mensaje a Telegram.
//   POST /contacto  el chat de arnoldwork.com guarda aquí una copia de cada mensaje; si la API
//                   principal falló, este mismo Worker lo manda a Telegram para que no se pierda.
//   GET  /contactos?clave=<PRUEBA_CLAVE>  descarga los mensajes de los últimos 90 días (CSV).
//   GET  /diagnostico  dice si los secretos están bien puestos y cómo fue el último aviso de Ko-fi (sin enseñar nada secreto).
//   GET  /          muestra el estado; con ?prueba=<PRUEBA_CLAVE> manda además el informe a Telegram.
//
// Secretos (se ponen en Cloudflare → vigilante → Configuración → Variables y secretos):
//   TELEGRAM_TOKEN  token del bot de Telegram (obligatorio).
//   KOFI_TOKEN      «Verification Token» de Ko-fi (Ajustes → API → Webhooks). Sin él no se aceptan avisos de Ko-fi.
//   PRUEBA_CLAVE    opcional: para ?prueba=… y para descargar los contactos.
// La memoria (qué está caído, ventas, contactos…) vive en un Durable Object que se crea solo al publicar.

import { DurableObject } from "cloudflare:workers";

const CHAT_ID = "288460670";
const LENTO_MS = 4000;
const DIA = 86400e3;
const RANKING = "https://cavework-ranking.arnoldwork.workers.dev";
const CAVEWORK_API = "https://cavework-api.arnoldwork.workers.dev/state";
const DOMINIO = { nombre: "arnoldwork.com", rdap: "https://rdap.verisign.com/com/v1/domain/arnoldwork.com" };
const ORIGENES = [
  /^https:\/\/(www\.)?arnoldwork\.com$/,
  /^https:\/\/[a-z0-9-]+-arnoldwork-v11\.arnoldwork\.workers\.dev$/,   // vistas previas
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,                        // pruebas en local
];
// Enlaces de la tienda de Ko-fi (ko-fi.com/s/<código>) → nombre del producto.
const PRODUCTOS_KOFI = {
  "c0801ad13f": "Libro",
  "5bf99e632d": "Ficha: Hipertrofia para empezar bien",
  "933c0fd088": "Ficha: Perder grasa sin perder el músculo",
  "8850046986": "Ficha: Estar en forma para la vida",
  "833e551486": "Pack completo: libro + las tres fichas",
};
const MOTIVO_NEGOCIO = "Web o automatización para mi negocio";

const COMPROBACIONES = [
  { nombre: "ArnoldWork",        url: "https://arnoldwork.com/",              texto: "ArnoldWork" },
  { nombre: "ArnoldWork (www)",  url: "https://www.arnoldwork.com/",          texto: "ArnoldWork" },
  { nombre: "Herramientas",      url: "https://arnoldwork.com/herramientas/", texto: "ArnoldWork" },
  { nombre: "Generador de rutina", url: "https://arnoldwork.com/herramientas/generador-de-rutina/", texto: "ArnoldWork" },
  { nombre: "HeavyWork",         url: "https://heavywork.arnoldwork.com/",    texto: "HeavyWork" },
  { nombre: "CaveWork",          url: "https://heavywork.arnoldwork.com/game/", texto: "CaveWork" },
  { nombre: "API contacto",      url: "https://arnoldwork-api.arnoldwork.workers.dev/" },
  { nombre: "API CaveWork",      url: "https://cavework-api.arnoldwork.workers.dev/" },
  { nombre: "Ranking CaveWork",  url: "https://cavework-ranking.arnoldwork.workers.dev/top", texto: "top" },
];

/* ================= Memoria ================= */

export class Memoria extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS contactos (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha INTEGER, nombre TEXT, motivo TEXT, mensaje TEXT, contacto TEXT, origen TEXT, ip TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS ventas (id TEXT PRIMARY KEY, fecha INTEGER, tipo TEXT, nombre TEXT, importe REAL, moneda TEXT, detalle TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS incidencias (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha INTEGER, nombre TEXT, detalle TEXT)`);
  }

  async leer(clave) { return (await this.ctx.storage.get(clave)) ?? null; }
  async guardar(clave, valor) { await this.ctx.storage.put(clave, valor); }

  // Guarda un mensaje del chat. Como mucho 5 por hora desde la misma conexión (antispam).
  guardarContacto(c, ip) {
    const ahora = Date.now();
    this.sql.exec(`DELETE FROM contactos WHERE fecha < ?`, ahora - 365 * DIA);   // se guardan 12 meses
    const recientes = this.sql.exec(`SELECT COUNT(*) AS n FROM contactos WHERE ip = ? AND fecha > ?`, ip, ahora - 3600e3).one().n;
    if (recientes >= 5) return false;
    this.sql.exec(`INSERT INTO contactos (fecha, nombre, motivo, mensaje, contacto, origen, ip) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ahora, c.nombre, c.motivo, c.mensaje, c.contacto, c.origen, ip);
    return true;
  }

  contactosDesde(desde) {
    return this.sql.exec(`SELECT fecha, nombre, motivo, mensaje, contacto, origen FROM contactos WHERE fecha >= ? ORDER BY fecha`, desde).toArray();
  }

  // Devuelve true si la venta es nueva (Ko-fi puede repetir un aviso).
  guardarVenta(v) {
    const antes = this.sql.exec(`SELECT COUNT(*) AS n FROM ventas WHERE id = ?`, v.id).one().n;
    if (antes) return false;
    this.sql.exec(`INSERT INTO ventas (id, fecha, tipo, nombre, importe, moneda, detalle) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      v.id, Date.now(), v.tipo, v.nombre, v.importe, v.moneda, v.detalle);
    return true;
  }

  ventasDesde(desde) {
    return this.sql.exec(`SELECT fecha, tipo, nombre, importe, moneda, detalle FROM ventas WHERE fecha >= ? ORDER BY fecha`, desde).toArray();
  }

  incidencia(nombre, detalle) {
    this.sql.exec(`INSERT INTO incidencias (fecha, nombre, detalle) VALUES (?, ?, ?)`, Date.now(), nombre, detalle);
    this.sql.exec(`DELETE FROM incidencias WHERE fecha < ?`, Date.now() - 90 * DIA);
  }

  incidenciasDesde(desde) {
    return this.sql.exec(`SELECT fecha, nombre, detalle FROM incidencias WHERE fecha >= ? ORDER BY fecha`, desde).toArray();
  }
}

const memoria = env => env.MEMORIA ? env.MEMORIA.get(env.MEMORIA.idFromName("vigilante")) : null;

/* ================= Comprobaciones ================= */

async function comprobarUnaVez(c) {
  const inicio = Date.now();
  try {
    const res = await fetch(c.url, {
      headers: { "User-Agent": "ArnoldWork-Vigilante" },
      cf: { cacheTtl: 0 },
      signal: AbortSignal.timeout(10000),
    });
    const ms = Date.now() - inicio;
    // Las APIs pueden responder 404/405 a una visita normal: eso significa que están vivas.
    // Solo es fallo si el servidor da error (5xx) o no responde.
    if (res.status >= 500) return { ...c, ok: false, detalle: `error ${res.status}` };
    if (c.texto) {
      if (!res.ok) return { ...c, ok: false, detalle: `respuesta ${res.status}` };
      const html = await res.text();
      if (!html.includes(c.texto)) return { ...c, ok: false, detalle: "carga, pero el contenido no es el esperado" };
    }
    return { ...c, ok: true, ms, detalle: `${ms} ms` };
  } catch (e) {
    return { ...c, ok: false, detalle: e.name === "TimeoutError" ? "no responde (más de 10 s)" : "no se puede conectar" };
  }
}

// Un fallo suelto de red no es una caída: se repite una vez antes de dar la alarma.
// Lo mismo con la lentitud: solo cuenta si va lenta dos veces seguidas.
async function comprobar(c) {
  const primero = await comprobarUnaVez(c);
  if (primero.ok && primero.ms <= LENTO_MS) return primero;
  await new Promise(r => setTimeout(r, 5000));
  const segundo = await comprobarUnaVez(c);
  if (segundo.ok && primero.ok && segundo.ms > LENTO_MS) return { ...segundo, lento: true, detalle: `${segundo.ms} ms 🐢` };
  return segundo;
}

async function revisarTodo() {
  return Promise.all(COMPROBACIONES.map(comprobar));
}

function informe(resultados, titulo) {
  const lineas = resultados.map(r => `${r.ok ? (r.lento ? "🐢" : "✅") : "❌"} ${r.nombre}: ${r.detalle}`);
  return `${titulo}\n\n${lineas.join("\n")}`;
}

// Días que faltan para que caduque el dominio (null si no se puede saber).
async function diasDominio() {
  try {
    const r = await fetch(DOMINIO.rdap, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    const ev = (d.events || []).find(e => e.eventAction === "expiration");
    return ev ? Math.floor((Date.parse(ev.eventDate) - Date.now()) / DIA) : null;
  } catch { return null; }
}

async function leerJSON(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(8000) }); return r.ok ? await r.json() : null; }
  catch { return null; }
}

/* ================= Telegram ================= */

async function enviarTelegram(env, texto) {
  if (!env.TELEGRAM_TOKEN) throw new Error("Falta el secreto TELEGRAM_TOKEN");
  const res = await fetch(`https://api.telegram.org/bot${String(env.TELEGRAM_TOKEN).trim()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: texto, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
}

async function enviarDocumento(env, nombre, contenido, tipo, pie) {
  if (!env.TELEGRAM_TOKEN) throw new Error("Falta el secreto TELEGRAM_TOKEN");
  const f = new FormData();
  f.append("chat_id", CHAT_ID);
  if (pie) f.append("caption", pie);
  f.append("document", new File([contenido], nombre, { type: tipo }));
  const res = await fetch(`https://api.telegram.org/bot${String(env.TELEGRAM_TOKEN).trim()}/sendDocument`, { method: "POST", body: f });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
}

/* ================= Utilidades ================= */

const num = n => Math.floor(n).toLocaleString("es-ES");
const dinero = (n, moneda) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda === "EUR" ? "€" : moneda}`;
const fechaCorta = t => new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const recorta = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

function csv(filas, columnas) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [columnas.join(";"), ...filas.map(f => columnas.map(c => esc(c === "fecha" ? new Date(f[c]).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) : f[c])).join(";"))].join("\r\n");
}

function sumaPorMoneda(ventas) {
  const t = {};
  for (const v of ventas) t[v.moneda] = (t[v.moneda] || 0) + v.importe;
  return Object.entries(t).map(([m, n]) => dinero(n, m)).join(" + ") || "0 €";
}

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const h = { "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
  if (ORIGENES.some(r => r.test(o))) h["Access-Control-Allow-Origin"] = o;
  return h;
}

/* ================= Tareas programadas ================= */

async function revisionCadaMediaHora(env) {
  const m = memoria(env);
  const resultados = await revisarTodo();
  const fallos = resultados.filter(r => !r.ok);
  const lentos = resultados.filter(r => r.lento);

  if (!m) {
    // Sin memoria: avisa en cada revisión mientras algo falle.
    if (fallos.length) await enviarTelegram(env, informe(fallos, "🚨 ¡Algo se ha caído en ArnoldWork!"));
    return;
  }

  const antes = (await m.leer("caidos")) || [];
  const nuevos = fallos.filter(r => !antes.includes(r.nombre));
  const vueltos = resultados.filter(r => r.ok && antes.includes(r.nombre));
  for (const r of nuevos) await m.incidencia(r.nombre, r.detalle);
  if (nuevos.length) await enviarTelegram(env, informe(nuevos, "🚨 ¡Algo se ha caído en ArnoldWork!"));
  if (vueltos.length) await enviarTelegram(env, informe(vueltos, "💪 Vuelve a funcionar:"));
  await m.guardar("caidos", fallos.map(r => r.nombre));

  const lentosAntes = (await m.leer("lentos")) || [];
  const lentosNuevos = lentos.filter(r => !lentosAntes.includes(r.nombre));
  if (lentosNuevos.length) await enviarTelegram(env, informe(lentosNuevos, `🐢 Va lento (más de ${LENTO_MS / 1000} s en cargar):`));
  await m.guardar("lentos", lentos.map(r => r.nombre));

  // ¿Nuevo nº 1 en CaveWork?
  const rk = await leerJSON(RANKING + "/top");
  const uno = rk && rk.top && rk.top[0];
  if (uno) {
    const previo = await m.leer("numero1");
    const clave = `${uno.name}-${uno.score}`;
    if (previo && previo.clave !== clave) {
      await enviarTelegram(env, `👑 ¡Nuevo nº 1 en CaveWork!\n\n${uno.name} con ${num(uno.score)} puntos` +
        (previo.name ? `\n(antes: ${previo.name}, ${num(previo.score)})` : ""));
    }
    if (!previo || previo.clave !== clave) await m.guardar("numero1", { clave, name: uno.name, score: uno.score });
  }
}

async function resumenDiario(env) {
  const resultados = await revisarTodo();
  const fallos = resultados.filter(r => !r.ok);
  const titulo = fallos.length
    ? `☀️ Buenos días. Hay ${fallos.length} cosa(s) que fallan:`
    : "☀️ Buenos días. Todo funciona correctamente 💪";
  let texto = informe(resultados, titulo);
  const dias = await diasDominio();
  if (dias !== null && dias <= 30) texto += `\n\n⚠️ El dominio ${DOMINIO.nombre} caduca en ${dias} días. ¡Renuévalo!`;
  else if (dias !== null && dias <= 60) texto += `\n\n📅 El dominio ${DOMINIO.nombre} caduca en ${dias} días.`;
  await enviarTelegram(env, texto);
}

async function resumenSemanal(env) {
  const m = memoria(env);
  const hasta = Date.now(), desde = hasta - 7 * DIA;
  const [ventas, contactos, incidencias] = m
    ? await Promise.all([m.ventasDesde(desde), m.contactosDesde(desde), m.incidenciasDesde(desde)])
    : [[], [], []];
  const [rk, cw, dias] = await Promise.all([leerJSON(RANKING + "/top"), leerJSON(CAVEWORK_API), diasDominio()]);

  const compras = ventas.filter(v => v.tipo !== "Batido");
  const batidos = ventas.filter(v => v.tipo === "Batido");
  const negocio = contactos.filter(c => c.motivo === MOTIVO_NEGOCIO);

  const l = [`📊 Resumen de la semana en ArnoldWork (${fechaCorta(desde)} – ${fechaCorta(hasta - 1)})`, ""];
  l.push(incidencias.length
    ? `🌐 Webs: ${incidencias.length} caída(s) esta semana (${[...new Set(incidencias.map(i => i.nombre))].join(", ")})`
    : "🌐 Webs: todo funcionó sin caídas 💪");
  l.push(`💰 Ventas en Ko-fi: ${compras.length}${compras.length ? ` (${sumaPorMoneda(compras)})` : ""}`);
  l.push(`🥤 Batidos: ${batidos.length}${batidos.length ? ` (${sumaPorMoneda(batidos)})` : ""}`);
  l.push(`✉️ Mensajes del chat: ${contactos.length}${negocio.length ? ` · 💼 ${negocio.length} de negocio` : ""}`);
  if (cw && typeof cw.plays === "number") {
    const previas = m ? await m.leer("partidasLunes") : null;
    l.push(`🦖 CaveWork: ${num(cw.plays)} partidas en total${typeof previas === "number" && cw.plays >= previas ? ` (+${num(cw.plays - previas)} esta semana)` : ""}`);
    if (m) await m.guardar("partidasLunes", cw.plays);
  }
  if (rk) {
    if (rk.campeon) l.push(`👑 Campeón de la semana: ${rk.campeon.name} con ${num(rk.campeon.score)} puntos`);
    if (rk.top && rk.top[0]) l.push(`🏆 Nº 1 de siempre: ${rk.top[0].name} con ${num(rk.top[0].score)}`);
  }
  if (dias !== null) l.push(`📅 Dominio ${DOMINIO.nombre}: caduca en ${dias} días`);
  if (negocio.length) {
    l.push("", "💼 Posibles clientes:");
    for (const c of negocio) l.push(`• ${recorta(c.nombre, 40)} (${recorta(c.contacto, 60)}): ${recorta(c.mensaje, 140)}`);
  }
  await enviarTelegram(env, l.join("\n"));

  // Copias de seguridad
  const dia = new Date().toISOString().slice(0, 10);
  const exp = await leerJSON(RANKING + "/export");
  if (exp) await enviarDocumento(env, `ranking-cavework-${dia}.json`, JSON.stringify(exp, null, 1), "application/json", "🗄️ Copia de seguridad del ranking de CaveWork");
  if (contactos.length) await enviarDocumento(env, `contactos-${dia}.csv`, csv(contactos, ["fecha", "nombre", "motivo", "mensaje", "contacto", "origen"]), "text/csv", "🗄️ Mensajes del chat de esta semana (se abre con Excel)");
}

/* ================= Peticiones ================= */

async function kofi(req, env) {
  const m = memoria(env);
  const anota = async resultado => { if (m) await m.guardar("ultimoKofi", { fecha: new Date().toISOString(), resultado }); };
  const form = await req.formData().catch(() => null);
  let d = null;
  try { d = JSON.parse(form && form.get("data")); } catch {}
  if (!d) { await anota("llegó algo que no son datos de Ko-fi"); return new Response("Datos no válidos", { status: 400 }); }
  if (!env.KOFI_TOKEN) { await anota("falta el secreto KOFI_TOKEN en Cloudflare"); return new Response("No autorizado", { status: 403 }); }
  if (String(d.verification_token || "").trim() !== env.KOFI_TOKEN.trim()) { await anota("el token de Ko-fi no coincide con KOFI_TOKEN"); return new Response("No autorizado", { status: 403 }); }

  const importe = parseFloat(d.amount) || 0;
  const moneda = d.currency || "EUR";
  const nombre = recorta(d.from_name, 60) || "Alguien";
  let tipo, detalle, texto;
  if (d.type === "Shop Order") {
    const items = (d.shop_items || []).map(i => (PRODUCTOS_KOFI[i.direct_link_code] || `Producto ${i.direct_link_code}`) + (i.quantity > 1 ? ` ×${i.quantity}` : ""));
    tipo = "Venta"; detalle = items.join(", ") || "Tienda";
    texto = `💰 ¡Venta en Ko-fi!\n\n${detalle}\n${dinero(importe, moneda)} · ${nombre}`;
  } else if (d.type === "Subscription") {
    tipo = "Suscripción"; detalle = d.tier_name || "Suscripción";
    texto = `⭐ ${d.is_first_subscription_payment ? "¡Nueva suscripción!" : "Renovación de suscripción"} en Ko-fi\n\n${detalle} · ${dinero(importe, moneda)} · ${nombre}`;
  } else {
    tipo = "Batido"; detalle = d.message ? recorta(d.message, 300) : "";
    texto = `🥤 ¡${nombre} te ha invitado a un batido!\n\n${dinero(importe, moneda)}${detalle ? `\n«${detalle}»` : ""}`;
  }

  const nueva = m ? await m.guardarVenta({ id: String(d.kofi_transaction_id || d.message_id || crypto.randomUUID()), tipo, nombre, importe, moneda, detalle }) : true;
  if (!nueva) { await anota("aviso repetido de Ko-fi (ya se había enviado)"); return new Response("OK"); }
  try { await enviarTelegram(env, texto); }
  catch (e) { await anota("Ko-fi bien, pero Telegram falló: " + e.message.replace(/bot[^/]+\//g, "")); return new Response("OK"); }
  await anota(`✅ recibido (${d.type}) y enviado a Telegram`);
  return new Response("OK");
}

async function contacto(req, env) {
  const h = { "Content-Type": "application/json", ...cors(req) };
  if (!h["Access-Control-Allow-Origin"]) return new Response('{"error":"Origen no permitido"}', { status: 403, headers: h });
  const b = await req.json().catch(() => null);
  if (!b) return new Response('{"error":"Datos no válidos"}', { status: 400, headers: h });
  const c = {
    nombre: recorta(b.nombre, 80), motivo: recorta(b.motivo, 80), mensaje: String(b.mensaje ?? "").trim().slice(0, 2000),
    contacto: recorta(b.contacto, 160), origen: recorta(b.origen, 200),
  };
  if (!c.nombre || !c.mensaje) return new Response('{"error":"Faltan datos"}', { status: 400, headers: h });
  const m = memoria(env);
  const ip = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((req.headers.get("CF-Connecting-IP") || "") + "aw"))
    .then(x => [...new Uint8Array(x)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join(""));
  const guardado = m ? await m.guardarContacto(c, ip) : false;
  if (m && !guardado) return new Response('{"error":"Demasiados mensajes, prueba en un rato"}', { status: 429, headers: h });
  // Si la API principal no pudo avisar, avisa el vigilante.
  if (b.principalOk === false) {
    const neg = c.motivo === MOTIVO_NEGOCIO;
    await enviarTelegram(env, `${neg ? "💼 CLIENTE DEV" : "✉️ Mensaje"} del chat (enviado por el vigilante: la API principal falló)\n\n` +
      `👤 ${c.nombre}\n📌 ${c.motivo}\n💬 ${c.mensaje}\n📮 ${c.contacto || "—"}`);
  }
  return new Response('{"ok":true}', { headers: h });
}

export default {
  async scheduled(event, env, ctx) {
    if (event.cron === "0 7 * * *") return resumenDiario(env);
    if (event.cron === "30 7 * * 1") return resumenSemanal(env);
    return revisionCadaMediaHora(env);
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (req.method === "POST" && url.pathname === "/kofi") return kofi(req, env);
    if (req.method === "POST" && url.pathname === "/contacto") return contacto(req, env);

    if (url.pathname === "/diagnostico") {
      const tg = env.TELEGRAM_TOKEN ? String(env.TELEGRAM_TOKEN).trim() : "";
      let bot = null;
      if (tg) {
        const r = await fetch(`https://api.telegram.org/bot${tg}/getMe`).then(x => x.json()).catch(() => null);
        bot = r && r.ok ? "✅ válido (@" + r.result.username + ")" : "❌ Telegram no lo acepta: revisa que esté completo";
      }
      const m = memoria(env);
      const k = m ? await m.leer("ultimoKofi") : null;
      const lineas = [
        "Diagnóstico del vigilante", "",
        `TELEGRAM_TOKEN: ${tg ? bot : "❌ no está puesto"}`,
        `KOFI_TOKEN: ${env.KOFI_TOKEN ? "✅ puesto" : "❌ no está puesto"}`,
        `PRUEBA_CLAVE: ${env.PRUEBA_CLAVE ? "✅ puesta" : "— (opcional, no puesta)"}`,
        `Último aviso de Ko-fi: ${k ? `${k.resultado} · ${new Date(k.fecha).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}` : "todavía no ha llegado ninguno"}`,
      ];
      return new Response(lineas.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }

    const clave = url.searchParams.get("clave") || url.searchParams.get("prueba");
    const autorizado = clave && env.PRUEBA_CLAVE && clave === env.PRUEBA_CLAVE;

    if (url.pathname === "/contactos") {
      if (!autorizado) return new Response("No autorizado", { status: 403 });
      const m = memoria(env);
      const filas = m ? await m.contactosDesde(Date.now() - 90 * DIA) : [];
      return new Response(csv(filas, ["fecha", "nombre", "motivo", "mensaje", "contacto", "origen"]), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contactos.csv"` },
      });
    }

    const resultados = await revisarTodo();
    if (url.searchParams.get("prueba") && autorizado) {
      await enviarTelegram(env, informe(resultados, "🧪 Prueba del vigilante de ArnoldWork"));
    }
    return new Response(informe(resultados, "Estado de ArnoldWork"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
