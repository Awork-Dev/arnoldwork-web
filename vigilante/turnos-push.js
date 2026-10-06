// TurnoWork · avisos en el móvil la noche antes (Web Push, solo usuarios Pro).
//
// El servidor no sabe nada de los turnos de nadie: cada noche manda un aviso VACÍO a cada móvil apuntado,
// y es la propia app (su service worker) la que, con la agenda guardada en el móvil, escribe
// «Mañana: Tarde 14:50–23:10» o «Mañana libras».
//
//   GET  /api/push/clave            clave pública VAPID (se crea sola la primera vez y se guarda en la memoria).
//   POST /api/push { accion:"alta", email, sub }   apunta este móvil (exige Pro).
//   POST /api/push { accion:"baja", endpoint }     lo quita.
//   POST /api/push { accion:"prueba", endpoint }   manda un aviso ahora (para comprobar).
// Cron diario (vigilante): enviarAvisos(env, m).

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const txtB64u = s => b64u(new TextEncoder().encode(s));

// Claves VAPID: se generan una vez y se guardan en la memoria (Durable Object).
async function claves(m) {
  let k = await m.leer("vapid");
  if (!k) {
    const par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    k = { privada: await crypto.subtle.exportKey("jwk", par.privateKey), publica: b64u(await crypto.subtle.exportKey("raw", par.publicKey)) };
    await m.guardar("vapid", k);
  }
  return k;
}

async function cabeceraVapid(endpoint, k) {
  const aud = new URL(endpoint).origin;
  const cab = txtB64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const cuerpo = txtB64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:arnoldwork4you@gmail.com" }));
  const clave = await crypto.subtle.importKey("jwk", k.privada, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, clave, new TextEncoder().encode(`${cab}.${cuerpo}`));
  return `vapid t=${cab}.${cuerpo}.${b64u(firma)}, k=${k.publica}`;
}

// Aviso vacío: el móvil decide qué texto enseñar con su propia agenda.
async function avisar(endpoint, k) {
  const r = await fetch(endpoint, { method: "POST", headers: { Authorization: await cabeceraVapid(endpoint, k), TTL: "43200", Urgency: "normal", "Content-Length": "0" } });
  return r.status;
}

export async function pushApi(req, env, m, { huellaCorreo, esProSinLimite }) {
  if (!m) return json({ error: "Sin memoria" }, 503);
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname === "/api/push/clave") return json({ clave: (await claves(m)).publica });
  if (req.method !== "POST") return json({ error: "Método no válido" }, 405);
  const b = await req.json().catch(() => null);
  const accion = String(b?.accion || "");

  if (accion === "alta") {
    const email = String(b?.email || "").trim(), sub = b?.sub;
    if (!email.includes("@") || !sub?.endpoint || !/^https:\/\//.test(sub.endpoint)) return json({ error: "Datos no válidos" }, 400);
    const hu = await huellaCorreo(email);
    if (!(await esProSinLimite(hu))) return json({ error: "Los avisos son de VidaWork Pro" }, 403);
    await m.pushAlta(sub.endpoint, hu);
    return json({ ok: true });
  }
  const endpoint = String(b?.endpoint || "");
  if (!/^https:\/\//.test(endpoint)) return json({ error: "Datos no válidos" }, 400);
  if (accion === "baja") { await m.pushBaja(endpoint); return json({ ok: true }); }
  if (accion === "prueba") {
    if (!(await m.pushExiste(endpoint))) return json({ error: "Este móvil no tiene los avisos activados" }, 404);
    const st = await avisar(endpoint, await claves(m));
    if (st === 404 || st === 410) { await m.pushBaja(endpoint); return json({ error: "El móvil ya no acepta avisos: vuelve a activarlos" }, 410); }
    return json({ ok: st >= 200 && st < 300, estado: st });
  }
  return json({ error: "Acción no válida" }, 400);
}

// Cada noche: un aviso a cada móvil apuntado. Los que ya no existen se borran.
export async function enviarAvisos(env, m) {
  if (!m) return { enviados: 0 };
  const k = await claves(m), lista = await m.pushLista();
  let enviados = 0, borrados = 0;
  for (const endpoint of lista) {
    try {
      const st = await avisar(endpoint, k);
      if (st === 404 || st === 410) { await m.pushBaja(endpoint); borrados++; } else if (st < 300) enviados++;
    } catch (e) { /* se reintenta mañana */ }
  }
  return { enviados, borrados, total: lista.length };
}
