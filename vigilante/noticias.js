// Noticias de la semana para ArnoldWork (hipertrofia) y HeavyWork (Heavy Duty).
// Fuentes gratuitas y sin claves:
//   - PubMed (estudios científicos, API oficial E-utilities del NIH).
//   - Google Noticias (RSS de búsqueda, en español e inglés).
// Solo se envían titulares con enlace a la fuente; nunca se copian artículos.

const PUBMED = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const HERRAMIENTA = "tool=arnoldwork-vigilante";
// Fuera animales, pacientes y rehabilitación (el público es gente de gimnasio),
// y cartas, comentarios o editoriales, que no aportan nada nuevo.
const FUERA = ' NOT (rats[tiab] OR mice[tiab] OR rat[tiab] OR mouse[tiab] OR murine[tiab])' +
  ' NOT (patients[ti] OR patient[ti] OR disease[ti] OR cancer[ti] OR "heart failure"[tiab] OR "renal failure"[tiab] OR "kidney failure"[tiab]' +
  ' OR rehabilitation[ti] OR elderly[ti] OR "older adults"[ti] OR older[ti] OR children[ti] OR adolescents[ti] OR pregnancy[ti] OR spaceflight[ti] OR clinical[ti]' +
  ' OR myocardial[tiab] OR cardiac[ti] OR heart[ti] OR surgery[ti] OR prostatectomy[ti] OR incontinence[ti] OR obesity[ti])' +
  ' NOT (letter[pt] OR comment[pt] OR editorial[pt] OR erratum[pt])';
const PESAS = '("resistance training"[tiab] OR "resistance exercise"[tiab] OR "strength training"[tiab] OR "weight training"[tiab])';
const PESAS_TI = '("resistance training"[ti] OR "resistance exercise"[ti] OR "strength training"[ti] OR "weight training"[ti] OR hypertrophy[ti] OR bodybuilders[ti] OR bodybuilding[ti] OR "trained men"[ti] OR "trained women"[ti] OR "trained individuals"[ti])';

export const BLOQUES = [
  {
    clave: "hipertrofia",
    titulo: "🔬 HIPERTROFIA · para ArnoldWork",
    estudios: '((' + PESAS + ' AND (hypertrophy[ti] OR "muscle growth"[ti] OR "muscle size"[ti] OR "muscle thickness"[ti] OR "muscle mass"[ti] OR "lean mass"[ti] OR "fat-free mass"[ti] OR "cross-sectional area"[ti]))' +
      ' OR (' + PESAS_TI + ' AND (protein[ti] OR creatine[ti] OR supplementation[ti])) OR bodybuilders[ti] OR bodybuilding[ti])' + FUERA,
    noticias: [
      { q: 'culturismo OR hipertrofia OR "Mr. Olympia"', idioma: "es" },
    ],
  },
  {
    clave: "heavyduty",
    titulo: "🔥 HEAVY DUTY · para HeavyWork",
    estudios: PESAS_TI + ' AND (failure[tiab] OR "repetitions in reserve"[tiab] OR "low volume"[tiab] OR "low-volume"[tiab] OR "single set"[tiab] OR "single-set"[tiab]' +
      ' OR volume[ti] OR "rest interval"[tiab] OR "inter-set rest"[tiab] OR "set configuration"[tiab] OR frequency[ti] OR "high intensity training"[tiab] OR "high-intensity training"[tiab])' + FUERA,
    noticias: [
      { q: '"Mike Mentzer"', idioma: "es" },
      { q: '"Mike Mentzer"', idioma: "en" },
      { q: '"entrenamiento al fallo" OR "heavy duty" culturismo', idioma: "es" },
    ],
  },
];

const MAX_ESTUDIOS = 4, MAX_NOTICIAS = 4;

const espera = ms => new Promise(r => setTimeout(r, ms));
// PubMed admite 3 peticiones por segundo sin clave: se hacen de una en una y con pausa.
async function json(url) {
  await espera(450);
  const r = await fetch(url, { headers: { "User-Agent": "ArnoldWork-vigilante/1.0" }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`${r.status} en ${new URL(url).host}`);
  return r.json();
}

// Estudios publicados en PubMed en las dos últimas semanas (los ya enviados no se repiten), los más relevantes primero.
async function estudios(termino) {
  const q = `${PUBMED}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&datetype=edat&reldate=14&retmax=15&${HERRAMIENTA}&term=${encodeURIComponent(termino)}`;
  const ids = (await json(q)).esearchresult?.idlist || [];
  if (!ids.length) return [];
  const s = (await json(`${PUBMED}/esummary.fcgi?db=pubmed&retmode=json&${HERRAMIENTA}&id=${ids.join(",")}`)).result || {};
  return ids.map(id => s[id]).filter(Boolean).map(e => ({
    id: "pm" + e.uid, tipo: "estudio",
    titulo: limpia(e.title).replace(/\.$/, ""),
    fuente: limpia(e.fulljournalname || e.source || "PubMed"),
    enlace: `https://pubmed.ncbi.nlm.nih.gov/${e.uid}/`,
  }));
}

// Titulares de Google Noticias de la última semana.
async function noticias({ q, idioma }) {
  const pais = idioma === "es" ? "hl=es&gl=ES&ceid=ES:es" : "hl=en-US&gl=US&ceid=US:en";
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:7d")}&${pais}`,
    { headers: { "User-Agent": "Mozilla/5.0 ArnoldWork-vigilante" }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`${r.status} en Google Noticias`);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const campo = n => limpia((it.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`)) || [])[1] || "");
    const fuente = campo("source");
    let titulo = campo("title");
    if (fuente && titulo.endsWith(" - " + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    return { id: "gn" + clave(titulo), tipo: "noticia", titulo, fuente, enlace: campo("link") };
  }).filter(n => n.titulo && n.enlace);
}

function limpia(t) {
  return String(t).replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();
}
// La misma noticia sale en varios medios con títulos casi iguales: se compara sin tildes ni signos.
const html = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clave = t => t.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "").slice(0, 60);

// Busca en todas las fuentes. Devuelve, por sección, los estudios y noticias más recientes (sin filtrar).
export async function recoger() {
  const secciones = [], errores = [];
  for (const b of BLOQUES) {
    const [est, not] = await Promise.all([
      estudios(b.estudios).catch(e => { errores.push("PubMed: " + e.message); return []; }),
      Promise.all(b.noticias.map(n => noticias(n).catch(e => { errores.push("Noticias: " + e.message); return []; }))).then(l => l.flat()),
    ]);
    const unicos = lista => { const v = new Set(); return lista.filter(x => !v.has(x.id) && v.add(x.id)); };
    secciones.push({ clave: b.clave, titulo: b.titulo, estudios: unicos(est), noticias: unicos(not) });
  }
  return { secciones, errores: [...new Set(errores)] };
}

// Mensajes de Telegram (uno por sección; en HTML, con el titular como enlace), sin lo ya enviado otras semanas.
export function mensajesTelegram({ secciones, errores }, vistas = []) {
  const ya = new Set(vistas), nuevas = [], mensajes = [];
  for (const b of secciones) {
    const e = b.estudios.filter(x => !ya.has(x.id)).slice(0, MAX_ESTUDIOS);
    const n = b.noticias.filter(x => !ya.has(x.id)).slice(0, MAX_NOTICIAS);
    nuevas.push(...e, ...n);
    const enlace = x => `• <a href="${html(x.enlace)}">${html(x.titulo)}</a>${x.fuente ? " — <i>" + html(x.fuente) + "</i>" : ""}`;
    const l = [`<b>📰 ${html(b.titulo)}</b>`, "Noticias y estudios de la semana"];
    if (e.length) { l.push("", "<b>Estudios nuevos</b> (en inglés):"); e.forEach(x => l.push(enlace(x))); }
    if (n.length) { l.push("", "<b>En los medios:</b>"); n.forEach(x => l.push(enlace(x))); }
    if (!e.length && !n.length) l.push("", "Esta semana no hay nada nuevo.");
    l.push("", b.clave === "hipertrofia" ? "🌐 También en arnoldwork.com" : "🌐 También en heavywork.arnoldwork.com");
    let t = l.join("\n");
    while (t.length > 4000 && t.includes("\n•")) t = t.slice(0, t.lastIndexOf("\n•"));   // límite de Telegram
    mensajes.push(t);
  }
  if (errores.length) mensajes[mensajes.length - 1] += "\n\n⚠️ Alguna fuente no respondió: " + html(errores.join("; "));
  return { mensajes, nuevas: nuevas.map(x => x.id) };
}

// Lo que enseña cada web: lo último arriba, sin repetir, como mucho 12 por sección.
// `antes` es lo que ya se enseñaba; lo nuevo entra con la fecha en que se vio por primera vez.
const EN_WEB = 12;
export function paraWeb({ secciones }, antes = {}) {
  const ahora = Date.now(), web = { actualizado: ahora };
  for (const b of secciones) {
    const previo = antes[b.clave] || [], ya = new Set(previo.map(x => x.id));
    // Se alternan estudios y noticias para que haya de todo.
    const mezcla = [];
    for (let i = 0; i < Math.max(b.estudios.length, b.noticias.length); i++) mezcla.push(b.estudios[i], b.noticias[i]);
    const nuevos = mezcla.filter(x => x && !ya.has(x.id)).slice(0, 8)
      .map(({ id, tipo, titulo, fuente, enlace }) => ({ id, tipo, titulo, fuente, enlace, fecha: ahora }));
    web[b.clave] = nuevos.concat(previo).slice(0, EN_WEB);
  }
  return web;
}
