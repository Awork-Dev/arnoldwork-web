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
    titulo: "🔬 HIPERTROFIA · para ArnoldWork",
    estudios: '((' + PESAS + ' AND (hypertrophy[ti] OR "muscle growth"[ti] OR "muscle size"[ti] OR "muscle thickness"[ti] OR "muscle mass"[ti] OR "lean mass"[ti] OR "fat-free mass"[ti] OR "cross-sectional area"[ti]))' +
      ' OR (' + PESAS_TI + ' AND (protein[ti] OR creatine[ti] OR supplementation[ti])) OR bodybuilders[ti] OR bodybuilding[ti])' + FUERA,
    noticias: [
      { q: 'culturismo OR hipertrofia OR "Mr. Olympia"', idioma: "es" },
    ],
  },
  {
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
    id: "pm" + e.uid,
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
    return { id: "gn" + clave(titulo), titulo, fuente, enlace: campo("link") };
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

// Prepara los mensajes de la semana (uno por bloque; en HTML de Telegram, con el titular como enlace). `vistas` son los ids ya enviados otras semanas: no se repiten.
export async function resumenNoticias(vistas = []) {
  const ya = new Set(vistas), nuevas = [], errores = [], mensajes = [];
  for (const b of BLOQUES) {
    const [est, not] = await Promise.all([
      estudios(b.estudios).catch(e => { errores.push("PubMed: " + e.message); return []; }),
      Promise.all(b.noticias.map(n => noticias(n).catch(e => { errores.push("Noticias: " + e.message); return []; }))).then(l => l.flat()),
    ]);
    const vistasAqui = new Set();
    const elige = (lista, max) => lista.filter(x => !ya.has(x.id) && !vistasAqui.has(x.id) && vistasAqui.add(x.id)).slice(0, max);
    const e = elige(est, MAX_ESTUDIOS), n = elige(not, MAX_NOTICIAS);
    nuevas.push(...e, ...n);
    const enlace = x => `• <a href="${html(x.enlace)}">${html(x.titulo)}</a>${x.fuente ? " — <i>" + html(x.fuente) + "</i>" : ""}`;
    const l = [`<b>📰 ${html(b.titulo)}</b>`, "Noticias y estudios de la semana"];
    if (e.length) { l.push("", "<b>Estudios nuevos</b> (en inglés):"); e.forEach(x => l.push(enlace(x))); }
    if (n.length) { l.push("", "<b>En los medios:</b>"); n.forEach(x => l.push(enlace(x))); }
    if (!e.length && !n.length) l.push("", "Esta semana no hay nada nuevo.");
    let t = l.join("\n");
    while (t.length > 4000 && t.includes("\n•")) t = t.slice(0, t.lastIndexOf("\n•"));   // límite de Telegram
    mensajes.push(t);
  }
  if (errores.length) mensajes[mensajes.length - 1] += "\n\n⚠️ Alguna fuente no respondió: " + html([...new Set(errores)].join("; "));
  return { mensajes, nuevas: nuevas.map(x => x.id) };
}
