// ArnoldWork · Vigilante
// Comprueba cada 30 minutos que las webs respondan y avisa por Telegram si algo falla.
// Cada mañana manda un resumen "todo OK" (o lo que falle).
//
// Necesita un SECRETO llamado TELEGRAM_TOKEN (el token del bot de Telegram).
// Opcional:
//   - SECRETO PRUEBA_CLAVE: sin él, ?prueba=... no manda nada a Telegram.
//   - Espacio KV enlazado como ESTADO: avisa solo cuando algo se cae o vuelve,
//     en vez de repetir la alarma cada 30 minutos.
// Desencadenadores Cron:  */30 * * * *   y   0 7 * * *   (hora UTC: 9:00 en verano, 8:00 en invierno)

const CHAT_ID = "288460670";

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
    return { ...c, ok: true, detalle: `${ms} ms` };
  } catch (e) {
    return { ...c, ok: false, detalle: e.name === "TimeoutError" ? "no responde (más de 10 s)" : "no se puede conectar" };
  }
}

// Un fallo suelto de red no es una caída: se repite una vez antes de dar la alarma.
async function comprobar(c) {
  const primero = await comprobarUnaVez(c);
  if (primero.ok) return primero;
  await new Promise(r => setTimeout(r, 5000));
  return comprobarUnaVez(c);
}

async function revisarTodo() {
  return Promise.all(COMPROBACIONES.map(comprobar));
}

function informe(resultados, titulo) {
  const lineas = resultados.map(r => `${r.ok ? "✅" : "❌"} ${r.nombre}: ${r.detalle}`);
  return `${titulo}\n\n${lineas.join("\n")}`;
}

async function enviarTelegram(env, texto) {
  if (!env.TELEGRAM_TOKEN) throw new Error("Falta el secreto TELEGRAM_TOKEN");
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: texto, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
}

// Con el KV ESTADO, recuerda qué estaba caído en la última revisión.
async function leerCaidos(env) {
  if (!env.ESTADO) return null;
  return JSON.parse((await env.ESTADO.get("caidos")) || "[]");
}

async function guardarCaidos(env, nombres) {
  if (env.ESTADO) await env.ESTADO.put("caidos", JSON.stringify(nombres));
}

export default {
  // Se ejecuta solo, según los desencadenadores Cron
  async scheduled(event, env, ctx) {
    const resultados = await revisarTodo();
    const fallos = resultados.filter(r => !r.ok);
    const esResumenDiario = event.cron === "0 7 * * *";

    if (esResumenDiario) {
      const titulo = fallos.length
        ? `☀️ Buenos días. Hay ${fallos.length} cosa(s) que fallan:`
        : "☀️ Buenos días. Todo funciona correctamente 💪";
      await enviarTelegram(env, informe(resultados, titulo));
      return;
    }

    const antes = await leerCaidos(env);
    if (antes === null) {
      // Sin KV: avisa en cada revisión mientras algo falle.
      if (fallos.length) await enviarTelegram(env, informe(fallos, "🚨 ¡Algo se ha caído en ArnoldWork!"));
      return;
    }

    const ahora = fallos.map(r => r.nombre);
    const nuevos = fallos.filter(r => !antes.includes(r.nombre));
    const vueltos = resultados.filter(r => r.ok && antes.includes(r.nombre));
    if (nuevos.length) await enviarTelegram(env, informe(nuevos, "🚨 ¡Algo se ha caído en ArnoldWork!"));
    if (vueltos.length) await enviarTelegram(env, informe(vueltos, "💪 Vuelve a funcionar:"));
    await guardarCaidos(env, ahora);
  },

  // Visitar la dirección del Worker muestra el estado.
  // Añadiendo ?prueba=<PRUEBA_CLAVE> manda además el informe a Telegram (para probar que llega).
  async fetch(request, env) {
    const resultados = await revisarTodo();
    const url = new URL(request.url);
    const prueba = url.searchParams.get("prueba");
    if (prueba && env.PRUEBA_CLAVE && prueba === env.PRUEBA_CLAVE) {
      await enviarTelegram(env, informe(resultados, "🧪 Prueba del vigilante de ArnoldWork"));
    }
    return new Response(informe(resultados, "Estado de ArnoldWork"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
