// ArnoldWork · versión de la web y «Buscar actualización».
// Lo usan arnoldwork.com, HeavyWork y CaveWork (build.py lo copia a web/ y a heavywork/web/: edítalo en src/).
// Pinta en cada elemento con [data-version] la fecha de la versión que tienes abierta y un botón para
// buscar si hay una más nueva. /version.json lo escribe la publicación (GitHub Actions) con la fecha del cambio.
(() => {
  const sitios = document.querySelectorAll('[data-version]');
  if (!sitios.length) return;
  const en = (document.documentElement.lang || 'es').startsWith('en');
  const T = en
    ? { version: 'Version', buscar: 'Check for updates', buscando: 'Checking…', aldia: 'You have the latest version ✓', nueva: 'A new version is available', actualizar: 'Update now', sinRed: 'No connection. Try again later.' }
    : { version: 'Versión del', buscar: 'Buscar actualización', buscando: 'Buscando…', aldia: 'Tienes la última versión ✓', nueva: 'Hay una versión nueva', actualizar: 'Actualizar', sinRed: 'Sin conexión. Prueba más tarde.' };
  const CLAVE = 'version:' + location.host;
  const fecha = f => new Date(f).toLocaleString(en ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const leer = () => fetch('/version.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);

  if (!document.getElementById('estilo-version')) {
    const st = document.createElement('style');
    st.id = 'estilo-version';
    st.textContent = '.version{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:.8rem;opacity:.9;margin-top:12px}' +
      '.version button{font:inherit;font-weight:700;background:none;border:1px solid currentColor;color:inherit;padding:5px 10px;cursor:pointer;border-radius:3px;min-height:32px}' +
      '.version .nueva{font-weight:700}';
    document.head.append(st);
  }

  let cargada = null;
  function pinta(estado) {
    sitios.forEach(el => {
      el.classList.add('version');
      const txt = document.createElement('span');
      const b = document.createElement('button');
      b.type = 'button';
      if (estado === 'nueva') {
        txt.className = 'nueva'; txt.textContent = T.nueva;
        b.textContent = T.actualizar;
        b.onclick = async () => {
          try { const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); } catch {}
          location.reload();
        };
      } else {
        txt.textContent = estado === 'aldia' ? T.aldia : estado === 'sinRed' ? T.sinRed
          : cargada ? `${T.version} ${fecha(cargada.fecha)}` : '';
        b.textContent = estado === 'buscando' ? T.buscando : T.buscar;
        b.disabled = estado === 'buscando';
        b.onclick = buscar;
      }
      el.replaceChildren(txt, b);
    });
  }
  async function buscar() {
    pinta('buscando');
    // De paso, que el móvil revise también la app instalada (sin esperar: puede tardar).
    navigator.serviceWorker?.getRegistration().then(r => r?.update()).catch(() => {});
    const ultima = await leer();
    if (!ultima) return pinta('sinRed');
    if (cargada && ultima.version !== cargada.version) return pinta('nueva');
    pinta('aldia');
    clearTimeout(buscar.t); buscar.t = setTimeout(() => pinta(), 4000);
  }

  // La versión de lo que tienes abierto: la del servidor al cargar (las páginas se piden siempre a la red);
  // sin conexión, la última que se vio.
  leer().then(v => {
    if (v) { cargada = v; try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch {} }
    else { try { cargada = JSON.parse(localStorage.getItem(CLAVE)); } catch {} }
    if (cargada) pinta();
  });
})();
