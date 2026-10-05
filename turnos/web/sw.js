// TurnoWork funciona sin conexión: primero la red, y si no hay, lo último guardado.
// También enseña el aviso de la noche antes: el servidor manda un aviso vacío y aquí se escribe
// el texto con la agenda que la app deja guardada en este móvil (los turnos nunca salen del móvil para esto).
const CACHE = "turnowork-v44";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "icono.svg", "icono-192.png", "manifest.webmanifest"]))); });
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith("/version.json") || u.pathname.startsWith("/api/") || u.pathname.startsWith("/cal/") || u.pathname === "/__agenda") return;
  // Las páginas siempre se piden nuevas al servidor (sin caché del navegador) para que las mejoras lleguen al momento.
  const pide = e.request.mode === "navigate" ? fetch(e.request, { cache: "no-store" }) : fetch(e.request);
  e.respondWith(pide.then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("./"))));
});

const p2 = n => String(n).padStart(2, "0");
const fISO = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

async function textoAviso(prueba) {
  let ag = null;
  try { const r = await (await caches.open("tw-agenda")).match("/__agenda"); if (r) ag = await r.json(); } catch (e) {}
  const man = new Date(); man.setDate(man.getDate() + 1);
  const dia = ag && ag.dias ? ag.dias[fISO(man)] : null;
  if (!dia) return { title: "TurnoWork", body: "Abre TurnoWork para ver tu turno de mañana." };
  const notas = [...(dia.cole ? ["🎒 No hay cole · " + dia.cole] : []), ...(dia.notas || []).map(n => "📝 " + n)].join("\n");
  const title = (prueba ? "Prueba · " : "") + (dia.trabajo ? `Mañana: ${dia.n}${dia.h ? " · " + dia.h : ""}` : `Mañana: ${dia.n} 😴`);
  const body = notas || (dia.trabajo ? "Deja la ropa preparada y descansa bien." : "Disfruta del día.");
  return { title, body };
}

self.addEventListener("push", e => {
  let prueba = false; try { prueba = !!(e.data && e.data.json().prueba); } catch (x) {}
  e.waitUntil(textoAviso(prueba).then(t => self.registration.showNotification(t.title, {
    body: t.body, icon: "icono-192.png", badge: "icono-192.png", tag: "turno-manana", renotify: true, data: { url: "./" },
  })));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    for (const c of l) if ("focus" in c) return c.focus();
    return clients.openWindow("./");
  }));
});
