// HeavyWork · funciona sin conexión (en muchos gimnasios no hay cobertura).
// Páginas y archivos propios: primero la red (para tener siempre lo último) y, si no hay, lo guardado.
// Fuentes de Google: lo guardado primero. Las APIs del juego nunca se guardan.
const VERSION = 'hw-2026-09-24';
const PRECACHE = ['/', '/game/', '/difunde.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.ico'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const conTiempo = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('lento')), ms))]);

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(r).then(g => g || fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(k => k.put(r, c)); return res; })));
    return;
  }
  if (u.origin !== location.origin) return;           // APIs y demás: sin tocar
  e.respondWith((async () => {
    try {
      const res = await conTiempo(fetch(r), 4000);
      if (res.ok) { const c = res.clone(); caches.open(VERSION).then(k => k.put(r, c)); }
      return res;
    } catch {
      const g = await caches.match(r, { ignoreSearch: r.mode === 'navigate' });
      if (g) return g;
      if (r.mode === 'navigate') return caches.match(u.pathname.startsWith('/game') ? '/game/' : '/');
      throw new Error('sin conexión');
    }
  })());
});
