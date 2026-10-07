// VidaWork · sincronización entre dispositivos y calendario suscrito (solo usuarios Pro).
//
//   POST /api/sync   { accion, email, codigo?, datos?, t? }
//     accion "crear":  activa la sincronización para un correo con Pro y devuelve { codigo, cal }.
//                      Si ya existía, solo con reiniciar:true (borra lo guardado y da un código nuevo).
//     accion "bajar":  con email + código devuelve { datos, t, cal }.
//     accion "subir":  con email + código guarda { datos, t } (gana la versión más nueva).
//     accion "borrar": con email + código borra todo lo guardado.
//   GET /cal/<token>.ics  calendario de turnos y notas, para suscribirse desde Google, iPhone u Outlook.
//
// En el servidor se guarda: huella del correo, huella del código, el cuadrante (sin el ciclo menstrual,
// que nunca sale del móvil) y un token aleatorio para el enlace del calendario.

const MAX_DATOS = 300_000;
const CABECERAS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
async function sha(t) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))); }
function aleatorio(n, abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
  const r = crypto.getRandomValues(new Uint8Array(n)); return [...r].map(x => abc[x % abc.length]).join("");
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: CABECERAS });

export async function syncApi(req, env, m, { huellaCorreo, esPro }) {
  if (!m) return json({ error: "Sin memoria" }, 503);
  const b = await req.json().catch(() => null);
  const email = String(b?.email || "").trim(), accion = String(b?.accion || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Escribe el correo de tu Pro" }, 400);
  const hu = await huellaCorreo(email);

  if (accion === "crear") {
    const ip = (await sha((req.headers.get("CF-Connecting-IP") || "") + "#ip")).slice(0, 16);
    const pro = await esPro(hu, ip);
    if (pro === null) return json({ error: "Demasiados intentos, prueba dentro de una hora" }, 429);
    if (!pro) return json({ error: "La sincronización es de VidaWork Pro: activa antes Pro con este correo" }, 403);
    const ya = await m.syncFila(hu);
    if (ya && !b.reiniciar) return json({ error: "Ya tienes la sincronización activada. Escribe tu código en «Ya la tengo en otro móvil».", existe: true }, 409);
    const codigo = aleatorio(4) + "-" + aleatorio(4) + "-" + aleatorio(4), cal = aleatorio(28, "abcdefghijkmnpqrstuvwxyz23456789");
    await m.syncCrear(hu, await sha(codigo + "|aw-sync"), cal);
    return json({ ok: true, codigo, cal });
  }

  const codigo = String(b?.codigo || "").trim().toUpperCase();
  const fila = await m.syncFila(hu);
  if (!fila || !codigo || fila.codigo !== await sha(codigo + "|aw-sync")) return json({ error: "El correo o el código no coinciden" }, 403);

  if (accion === "bajar") return json({ ok: true, datos: fila.datos ? JSON.parse(fila.datos) : null, t: fila.t || 0, cal: fila.cal });
  if (accion === "subir") {
    const datos = JSON.stringify(b?.datos ?? null);
    if (datos.length > MAX_DATOS) return json({ error: "Tu cuadrante ocupa demasiado para sincronizarlo" }, 413);
    const t = +b?.t || Date.now();
    if (fila.t && t < fila.t) return json({ ok: false, masNuevo: true, t: fila.t }, 409);
    await m.syncGuardar(hu, datos, t);
    return json({ ok: true, t, cal: fila.cal });
  }
  if (accion === "borrar") { await m.syncBorrar(hu); return json({ ok: true }); }
  return json({ error: "Acción no válida" }, 400);
}

/* ================= Calendario (.ics) ================= */

const p2 = n => String(n).padStart(2, "0");
const fISO = d => `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
const deISO = s => { const [a, mm, d] = s.split("-").map(Number); return new Date(Date.UTC(a, mm - 1, d)); };
const masDias = (d, k) => new Date(d.getTime() + k * 864e5);
const diasEntre = (a, b) => Math.round((b - a) / 864e5);
const txt = t => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const hhmm = t => { const [h, mm] = String(t).split(":").map(Number); return (h || 0) + (mm || 0) / 60; };
const horaTxt = v => `${p2(Math.floor(((v % 24) + 24) % 24))}:${p2(Math.round((v % 1) * 60) % 60)}`;
// Fecha y hora «flotante» (hora local de quien mira el calendario, como en la app).
function fh(d, h) { const x = new Date(d.getTime() + Math.round(h * 60) * 60e3); return `${x.getUTCFullYear()}${p2(x.getUTCMonth() + 1)}${p2(x.getUTCDate())}T${p2(x.getUTCHours())}${p2(x.getUTCMinutes())}00`; }
const MANUALES = { V: "Vacaciones", AP: "Asuntos propios", B: "Baja", F: "Formación", J: "Juicio", C: "Compensación" };

export async function calendario(token, m) {
  const fila = m && /^[a-z0-9]{20,40}$/.test(token) ? await m.syncPorCal(token) : null;
  if (!fila || !fila.datos) return new Response("Calendario no encontrado", { status: 404 });
  const Y = JSON.parse(fila.datos);
  const ciclo = String(Y.patron || "").toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const turnoDe = d => { const k = fISO(d); if (Y.cambios?.[k]) return Y.cambios[k]; if (!ciclo.length || !Y.ref) return "L";
    const n = diasEntre(deISO(Y.ref), d) + (+Y.pos || 0); return ciclo[((n % ciclo.length) + ciclo.length) % ciclo.length]; };
  const sello = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ArnoldWork//VidaWork//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Mi agenda · VidaWork", "REFRESH-INTERVAL;VALUE=DURATION:PT4H", "X-PUBLISHED-TTL:PT4H"];
  const hoy = deISO(fISO(new Date())), aviso = +Y.avisoTurno || 0;
  for (let d = masDias(hoy, -60); d <= masDias(hoy, 400); d = masDias(d, 1)) {
    const k = fISO(d), kk = k.replace(/-/g, ""), t = turnoDe(d), x = Y.turnos?.[t];
    if (x) {
      L.push("BEGIN:VEVENT", `UID:tw-${kk}@vida.arnoldwork.com`, `DTSTAMP:${sello}`, `DTSTART:${fh(d, +x.ini)}`, `DTEND:${fh(d, +x.ini + +x.h)}`, `SUMMARY:${txt(`${t} · ${x.n || t}`)}`);
      if (aviso > 0) L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${txt(`${x.n || t} a las ${horaTxt(+x.ini)}`)}`, `TRIGGER:-PT${aviso}M`, "END:VALARM");
      L.push("END:VEVENT");
    } else if (MANUALES[t]) {
      L.push("BEGIN:VEVENT", `UID:tw-${kk}@vida.arnoldwork.com`, `DTSTAMP:${sello}`, `DTSTART;VALUE=DATE:${kk}`, `DTEND;VALUE=DATE:${fISO(masDias(d, 1)).replace(/-/g, "")}`, `SUMMARY:${MANUALES[t]}`, "TRANSP:TRANSPARENT", "END:VEVENT");
    }
    const n = Y.notas?.[k]; if (n && n.t) L.push(...evNota(n, d, `tw-nota-${kk}`, sello));
  }
  const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  for (const r of Y.repes || []) {
    if (!r || !r.t || !r.desde) continue;
    const o = deISO(r.desde);
    let rr = r.tipo === "semana" ? `FREQ=WEEKLY;BYDAY=${BY[o.getUTCDay()]}` : r.tipo === "mes" ? `FREQ=MONTHLY;BYMONTHDAY=${o.getUTCDate()}` : "FREQ=YEARLY";
    if (r.hasta) rr += ";UNTIL=" + r.hasta.replace(/-/g, "") + (r.h ? "T235959" : "");
    L.push(...evNota(r, o, `tw-repe-${String(r.id).replace(/[^a-z0-9]/gi, "")}`, sello, rr));
  }
  const TAR = { tarea: ["✅", ""], examen: ["📚", "Examen: "], entrega: ["📝", "Entrega: "] };
  for (const t of Y.tareas || []) {
    if (!t || t.hecha || !t.t || !/^\d{4}-\d{2}-\d{2}$/.test(t.f || "")) continue;
    const [e, n] = TAR[t.tipo] || TAR.tarea;
    L.push(...evNota({ t: n + t.t, h: t.h || "" }, deISO(t.f), `tw-tarea-${String(t.id).replace(/[^a-z0-9]/gi, "")}`, sello, null, e + " "));
  }
  L.push("END:VCALENDAR");
  return new Response(L.join("\r\n"), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": 'inline; filename="turnos.ics"' } });
}

function evNota(n, d, uid, sello, rrule, pref = "📝 ") {
  const resumen = pref + String(n.t).split("\n")[0].slice(0, 80), kk = fISO(d).replace(/-/g, "");
  const e = ["BEGIN:VEVENT", `UID:${uid}@vida.arnoldwork.com`, `DTSTAMP:${sello}`];
  if (n.h) { const h = hhmm(n.h); let hf = n.hf ? hhmm(n.hf) : h + 1; if (hf <= h) hf += 24; e.push(`DTSTART:${fh(d, h)}`, `DTEND:${fh(d, hf)}`); }
  else e.push(`DTSTART;VALUE=DATE:${kk}`, `DTEND;VALUE=DATE:${fISO(masDias(d, 1)).replace(/-/g, "")}`, "TRANSP:TRANSPARENT");
  if (rrule) e.push("RRULE:" + rrule);
  e.push(`SUMMARY:${txt(resumen)}`, `DESCRIPTION:${txt(n.t)}`);
  if (n.h) e.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${txt(resumen)}`, "TRIGGER:-PT30M", "END:VALARM");
  e.push("END:VEVENT"); return e;
}

/* ================= Agenda de hoy en texto (para el widget de Atajos del iPhone) ================= */

// GET /hoy/<token>.txt  Mismo token privado que el calendario. Devuelve texto plano, con la hora de España.
export async function hoyTexto(token, m) {
  const fila = m && /^[a-z0-9]{20,40}$/.test(token) ? await m.syncPorCal(token) : null;
  if (!fila || !fila.datos) return new Response("No encontrado", { status: 404 });
  const Y = JSON.parse(fila.datos);
  const ahora = new Date(), parte = o => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", ...o });
  const f = parte({ year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);   // AAAA-MM-DD
  const d = deISO(f), w = d.getUTCDay();
  const ciclo = String(Y.patron || "").toUpperCase().split(/[\s,;]+/).filter(Boolean);
  let t = "L"; if (Y.cambios?.[f]) t = Y.cambios[f]; else if (ciclo.length && Y.ref) { const n = diasEntre(deISO(Y.ref), d) + (+Y.pos || 0); t = ciclo[((n % ciclo.length) + ciclo.length) % ciclo.length]; }
  const L = [];
  const dia = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long" }).format(ahora);
  L.push(dia.charAt(0).toUpperCase() + dia.slice(1));
  const x = Y.turnos?.[t];
  if (x) L.push(`👷 ${x.n || t} ${horaTxt(+x.ini)}–${horaTxt(+x.ini + +x.h)}`);
  else if (MANUALES[t]) L.push(`🌴 ${MANUALES[t]}`);
  else if (ciclo.length) L.push("😌 Libras");
  const R = Y.rutina;
  if (R?.rot?.length && R.desde && Array.isArray(R.dias) && R.dias.includes(w) && f >= R.desde) {
    let k = 0; for (let q = deISO(R.desde); q < d; q = masDias(q, 1)) if (R.dias.includes(q.getUTCDay())) k++;
    L.push(`🏋️ ${R.rot[k % R.rot.length].n}`);
  }
  const C = Y.cole;
  const sinCole = (() => { if (!C || !C.activo) return false; if (w === 0 || w === 6) return false; if (C.noLect?.[f]) return true;
    if (C.fin && f > C.fin) return true; if (C.inicio && f < C.inicio) return true;
    return (C.vac || []).some(v => v.d && v.h && f >= v.d && f <= v.h); })();
  if (C?.activo && sinCole) L.push("🎒 Sin cole hoy");
  const extra = [];
  for (const h of Y.familia?.hijos || []) for (const a of h.acts || []) {
    if (!a.dias?.includes(w) || (a.desde && f < a.desde) || (a.hasta && f > a.hasta)) continue;
    if (a.soloCole !== false && sinCole) continue;
    extra.push([a.h || "", `${h.nombre}: ${a.t}${a.h ? " " + a.h : ""}${a.lleva ? " (lleva " + a.lleva + ")" : ""}`]);
    if (h.cumple && h.cumple.slice(5) === f.slice(5)) { /* el cumpleaños se añade abajo, una sola vez */ }
  }
  for (const h of Y.familia?.hijos || []) if (h.cumple && h.cumple.slice(5) === f.slice(5)) L.push(`🎂 Cumple de ${h.nombre}`);
  extra.sort((a, b) => a[0].localeCompare(b[0])).forEach(e => L.push("⚽ " + e[1]));
  const notas = [];
  if (Y.notas?.[f]?.t) notas.push([Y.notas[f].h || "", Y.notas[f].t.split("\n")[0].slice(0, 80)]);
  for (const r of Y.repes || []) {
    if (!r?.t || !r.desde || f < r.desde || (r.hasta && f > r.hasta)) continue;
    const o = deISO(r.desde);
    if (r.tipo === "semana" ? o.getUTCDay() === w : r.tipo === "mes" ? o.getUTCDate() === d.getUTCDate() : (o.getUTCMonth() === d.getUTCMonth() && o.getUTCDate() === d.getUTCDate()))
      notas.push([r.h || "", r.t.split("\n")[0].slice(0, 80)]);
  }
  notas.sort((a, b) => a[0].localeCompare(b[0])).forEach(n => L.push(`📝 ${n[0] ? n[0] + " " : ""}${n[1]}`));
  return new Response(L.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
