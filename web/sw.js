// ArnoldWork · funciona sin cobertura.
// Páginas: primero la red (así siempre ves la última versión) y, si no hay conexión, la copia guardada.
// Imágenes y fuentes: la copia guardada, que casi nunca cambian.
// Al cambiar algo que no sea una página (iconos, logo…), sube VERSION.
const VERSION = 'v1';
const CACHE = 'arnoldwork-' + VERSION;
const PRECACHE = ['/', '/herramientas/', '/404.html', '/img/logo.svg', '/favicon.svg', '/manifest.webmanifest'];

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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fuente) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('/herramientas/')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(guardado => guardado || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }))
  );
});
