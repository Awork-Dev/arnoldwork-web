// Pruebas automáticas de ArnoldWork. Se pasan en GitHub antes de publicar:
// si alguna falla, no se publica y la web real sigue como estaba.
//
//   node pruebas.mjs web         → arnoldwork.com (carpeta web/)
//   node pruebas.mjs heavywork   → heavywork.arnoldwork.com y CaveWork (carpeta heavywork/web/)
//
// Qué comprueba: que cada página cargue sin errores de JavaScript, que ningún enlace interno esté roto,
// que las herramientas no den resultados absurdos (NaN, undefined…), el chat de contacto y el juego.
// Todo lo externo (APIs, fuentes, analítica) se simula: las pruebas nunca tocan datos reales.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const QUE = process.argv[2] || 'web';
const RAIZ = path.resolve(import.meta.dirname, '..', QUE === 'web' ? 'web' : 'heavywork/web');
const DOMINIO = QUE === 'web' ? 'https://arnoldwork.com' : 'https://heavywork.arnoldwork.com';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2' };

let fallos = 0;
const mal = (donde, que) => { fallos++; console.log(`  ❌ ${donde}: ${que}`); };
const bien = que => console.log(`  ✅ ${que}`);

// Servidor mínimo: sirve la carpeta como lo hace Cloudflare (carpeta/ → carpeta/index.html, 404.html si no existe).
function archivo(p) {
  let f = path.join(RAIZ, decodeURIComponent(p.split('?')[0].split('#')[0]));
  if (!f.startsWith(RAIZ)) return null;
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return fs.existsSync(f) ? f : null;
}
const servidor = http.createServer((req, res) => {
  const f = archivo(req.url);
  if (!f) { res.writeHead(404, { 'Content-Type': TIPOS['.html'] }); return res.end(fs.existsSync(path.join(RAIZ, '404.html')) ? fs.readFileSync(path.join(RAIZ, '404.html')) : 'no'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

const navegador = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES', serviceWorkers: 'block' });

// Simulación de todo lo externo
const API = { lead: 200, copia: 200, enviados: [] };
await ctx.route(u => !u.href.startsWith(BASE), async r => {
  const u = r.request().url();
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const json = (status, cuerpo) => r.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  if (u.includes('arnoldwork-api') && u.endsWith('/lead')) { API.enviados.push('lead'); return json(API.lead, API.lead === 200 ? { ok: true } : { error: 'x' }); }
  if (u.includes('vigilante') && u.endsWith('/contacto')) { API.enviados.push('copia:' + r.request().postDataJSON().principalOk); return json(API.copia, API.copia === 200 ? { ok: true } : { error: 'x' }); }
  if (u.includes('vigilante') && u.endsWith('/revisiones')) return json(200, { gratis: 20, quedan: 17 });
  if (u.includes('cavework-api')) return json(200, { plays: 10, debt: 1, debtCents: 100, runId: 'prueba', top: [] });
  if (u.includes('cavework-ranking')) {
    const top = [{ name: 'AAA', score: 5000, level: 2, date: Date.now() }];
    if (u.endsWith('/partida')) return json(200, { runId: 'prueba' });
    if (u.endsWith('/score')) return json(200, { size: 50, top, semana: top, campeon: null, puesto: 2, puestoSemana: 2 });
    return json(200, { size: 50, top, semana: top, campeon: top[0] });
  }
  return r.abort();   // fuentes, analítica, Ko-fi…
});

const aLocal = href => href.replace(DOMINIO, BASE).replace(/^https:\/\/www\.arnoldwork\.com/, BASE);

async function abrir(ruta) {
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/.test(m.text())) errores.push(m.text()); });
  const res = await p.goto(BASE + ruta, { waitUntil: 'load' });
  await p.waitForTimeout(250);
  p.errores = errores;
  return { p, errores, estado: res ? res.status() : 0 };
}

// 1) Páginas y enlaces
const rutas = new Set(['/', '/404.html']);
const mapa = path.join(RAIZ, 'sitemap.xml');
if (fs.existsSync(mapa)) for (const m of fs.readFileSync(mapa, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) rutas.add(new URL(m[1]).pathname);
if (QUE === 'heavywork') rutas.add('/game/');

console.log(`\n▶ ${rutas.size} páginas de ${QUE}`);
const enlaces = new Map();   // ruta enlazada → página donde aparece
for (const ruta of rutas) {
  const { p, errores, estado } = await abrir(ruta);
  if (estado !== 200 && ruta !== '/404.html') mal(ruta, `responde ${estado}`);
  for (const e of errores) mal(ruta, `error de JavaScript: ${e}`);
  const hrefs = await p.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) {
    if (h.startsWith('#')) {
      if (h.length > 1 && !(await p.$(`[id="${h.slice(1)}"]`))) mal(ruta, `el enlace ${h} no lleva a ninguna parte`);
      continue;
    }
    const abs = aLocal(new URL(h, DOMINIO + ruta).href);
    if (abs.startsWith(BASE)) { const u = new URL(abs); if (!enlaces.has(u.pathname + u.hash)) enlaces.set(u.pathname + u.hash, ruta); }
  }
  if (!errores.length) bien(`${ruta} carga sin errores`);
  await p.close();
}
let rotos = 0;
for (const [destino, desde] of enlaces) {
  const [ruta, ancla] = destino.split('#');
  if (!archivo(ruta)) { rotos++; mal(desde, `enlace roto a ${ruta}`); continue; }
  if (ancla && ruta.endsWith('/')) {
    const html = fs.readFileSync(archivo(ruta), 'utf8');
    if (!html.includes(`id="${ancla}"`)) { rotos++; mal(desde, `el enlace ${destino} apunta a una sección que no existe`); }
  }
}
if (!rotos) bien(`${enlaces.size} enlaces internos, ninguno roto`);

// 2) Herramientas: rellenar datos y comprobar que no salen resultados absurdos
if (QUE === 'web') {
  const herramientas = [...rutas].filter(r => /^\/herramientas\/[^/]+\/$/.test(r));
  console.log(`\n▶ ${herramientas.length} herramientas con datos de prueba`);
  for (const ruta of herramientas) {
    const { p, errores } = await abrir(ruta);
    await p.$$eval('main input[type=number]', ins => ins.forEach(i => {
      if (i.offsetParent === null) return;
      const min = i.min !== '' ? +i.min : null, max = i.max !== '' ? +i.max : null;
      let v = i.value !== '' ? +i.value : min !== null && max !== null ? (min + max) / 2 : 80;
      if (min !== null && v < min) v = min; if (max !== null && v > max) v = max;
      if (i.step && i.step !== 'any' && +i.step >= 1) v = Math.round(v);
      i.value = String(v);
      i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    await p.$$eval('main select', ss => ss.forEach(s => { if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); } }));
    await p.waitForTimeout(200);
    const texto = await p.locator('main').innerText();
    const raro = texto.match(/\b(NaN|undefined|Infinity|null)\b/);
    if (raro) mal(ruta, `muestra «${raro[1]}» con datos normales`);
    for (const e of errores) mal(ruta, `error de JavaScript al calcular: ${e}`);
    if (!raro && !errores.length) bien(`${ruta} calcula bien`);
    await p.close();
  }

  // 3) Chat de contacto: normal, con la API principal caída (copia de seguridad) y con todo caído
  console.log('\n▶ Chat de contacto');
  async function chat(lead, copia) {
    API.lead = lead; API.copia = copia; API.enviados = [];
    const { p, errores } = await abrir('/');
    await p.evaluate(() => openChat('Web o automatización para mi negocio'));
    for (const t of ['Prueba', 'Quiero una web para mi gimnasio', 'prueba@ejemplo.com']) {
      await p.locator('#chatInput input, #chatInput textarea').first().fill(t);
      await p.keyboard.press('Enter');
      await p.waitForTimeout(350);
    }
    await p.waitForTimeout(900);
    const log = await p.locator('#chatLog').innerText();
    await p.close();
    return { ok: log.includes('¡Recibido'), errores, enviados: API.enviados.join(',') };
  }
  let r = await chat(200, 200);
  r.ok && r.enviados === 'lead,copia:true' && !r.errores.length ? bien('mensaje enviado y copia guardada') : mal('chat', `normal: ${JSON.stringify(r)}`);
  r = await chat(500, 200);
  r.ok && r.enviados === 'lead,copia:false' ? bien('si la API principal falla, el mensaje llega igual por el vigilante') : mal('chat', `API caída: ${JSON.stringify(r)}`);
  r = await chat(500, 500);
  !r.ok ? bien('si todo falla, avisa al usuario para que escriba por otra vía') : mal('chat', 'con todo caído dice que se ha enviado');
}

// 4) El juego arranca, se juega y termina
if (QUE === 'heavywork') {
  console.log('\n▶ Revisión gratis');
  {
    const { p } = await abrir('/');
    await p.waitForTimeout(800);
    const t = await p.locator('#plazasRev').innerText();
    /primeros en pedirla/.test(t) && !/\d/.test(t) ? bien(`anuncia la revisión gratis sin números («${t}»)`) : mal('/', `plazas de revisión: «${t}»`);
    await p.close();
  }
  console.log('\n▶ CaveWork');
  const { p, errores } = await abrir('/game/');
  await p.evaluate(() => { store.tut = true; saveStore(); });
  await p.click('#btnJugar');
  await p.waitForTimeout(2500);
  const jugando = await p.evaluate(() => G.state);
  await p.evaluate(() => { G.score = 1234; G.hearts = 1; G.inv = 0; G.fx.shield = false; hurt('raptor'); });
  await p.waitForTimeout(1800);
  const fin = await p.locator('#pFin').isVisible();
  for (const e of errores) mal('/game/', `error de JavaScript jugando: ${e}`);
  fin ? bien(`se juega (estado «${jugando}») y la partida termina bien`) : mal('/game/', 'la pantalla final no aparece');
  await p.click('#pFin [data-abrir="pTop"]');
  await p.waitForTimeout(400);
  (await p.locator('#topCuerpo tr').count()) ? bien('el ranking se muestra') : mal('/game/', 'el ranking sale vacío');
  await p.close();

  // Reto del día: empieza con su condición, termina y lo indica en la pantalla final
  const { p: d } = await abrir('/game/');
  await d.evaluate(() => { store.tut = true; store.diario = null; saveStore(); });
  await d.click('#btnDiario');
  await d.waitForTimeout(1500);
  const modo = await d.evaluate(() => G.modo + ':' + G.cond);
  await d.evaluate(() => { G.score = 999; G.hearts = 1; G.inv = 0; G.fx.shield = false; G.fx.pre = 0; hurt('raptor'); });
  await d.waitForTimeout(1800);
  (await d.locator('#finModo').isVisible()) && modo.startsWith('diario:') ? bien(`reto del día (${modo.split(':')[1]}) se juega y termina`) : mal('/game/', `el reto del día no funciona (${modo})`);
  // El mamut (segundo jefe) aparece, ataca y cae sin errores
  await d.click('#btnOtra'); await d.waitForTimeout(800);
  await d.evaluate(() => { G.bosses = 1; G.entities = []; G.inv = 99; bossStart(); });
  await d.waitForTimeout(3500);
  const jefe = await d.evaluate(() => G.boss && G.boss.tipo);
  await d.evaluate(() => { G.boss.hp = 0; bossKO(); });
  await d.waitForTimeout(300);
  for (const e of d.errores || []) mal('/game/', e);
  jefe === 'mamut' ? bien('el mamut aparece y se le puede derrotar') : mal('/game/', `el segundo jefe es «${jefe}»`);
  await d.close();
}

await navegador.close();
servidor.close();
console.log(fallos ? `\n❌ ${fallos} problema(s). No se publica.` : '\n✅ Todo correcto.');
process.exit(fallos ? 1 : 0);
