// ArnoldWork · funciona sin cobertura. Este archivo lo genera build.py a partir de src/sw.js: no lo edites en web/.
// Páginas, estilos y código: primero la red (así siempre ves la última versión) y, sin conexión, la copia guardada.
// Imágenes y fuentes: la copia guardada, que casi nunca cambian.
const VERSION = '{{VERSION}}';
const CACHE = 'arnoldwork-' + VERSION;
const PRECACHE = {{PRECACHE}};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('arnoldwork-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guarda(req, res) {
  if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fuente) return;

  const estatico = fuente || req.destination === 'image' || req.destination === 'font';
  if (estatico) {
    e.respondWith(caches.match(req).then(g => g || fetch(req).then(res => guarda(req, res))));
    return;
  }

  e.respondWith(
    fetch(req)
      .then(res => guarda(req, res))
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then(r => r || (req.mode === 'navigate' ? caches.match('/herramientas/') : Response.error())))
  );
});
