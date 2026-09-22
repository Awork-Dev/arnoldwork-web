// ArnoldWork · genera web/img/og/<slug>.png (la imagen al compartir) para cada herramienta del catálogo.
// Uso: npm i playwright-core && node src/og/generar.mjs
// Opcional: CHROME=/ruta/a/chrome  FUENTES_CSS=archivo.css (fuentes locales si no hay acceso a Google Fonts)
// Después ejecuta python3 build.py para que cada página apunte a su imagen.
import { chromium } from 'playwright-core';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const lista = JSON.parse(execFileSync('python3', ['-c',
  'import sys,json;sys.path.insert(0,"src/herramientas");from catalogo import HERRAMIENTAS as H;' +
  'print(json.dumps([{k:h[k] for k in ("slug","h1","intro")} for h in H]))'], { cwd: raiz }));
let html = fs.readFileSync(path.join(raiz, 'src/og/plantilla.html'), 'utf8');
if (process.env.FUENTES_CSS) html = html.replace('/*FUENTES*/', fs.readFileSync(process.env.FUENTES_CSS, 'utf8'));
const tmp = path.join(raiz, 'src/og/.tmp.html');
fs.writeFileSync(tmp, html);
fs.mkdirSync(path.join(raiz, 'web/img/og'), { recursive: true });

const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + tmp);
await p.evaluate(() => document.fonts.ready);
for (const h of lista) {
  let primera = h.intro.split(/(?<=[.!?])\s/)[0];
  if (primera.length > 110) primera = primera.slice(0, primera.lastIndexOf(',', 110)) + '.';
  await p.evaluate(([t, s]) => {
    const h1 = document.getElementById('t'); h1.textContent = t; document.getElementById('s').textContent = s;
    let fs = 96; h1.style.fontSize = fs + 'px';
    while (h1.scrollHeight > 200 && fs > 56) { fs -= 4; h1.style.fontSize = fs + 'px'; }
  }, [h.h1, primera]);
  await p.screenshot({ path: path.join(raiz, 'web/img/og', h.slug + '.png') });
  console.log('web/img/og/' + h.slug + '.png');
}
await b.close();
fs.unlinkSync(tmp);
