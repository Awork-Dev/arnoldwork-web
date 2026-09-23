/* ArnoldWork · «Da a conocer»: botones para compartir la web con el mensaje ya escrito.
   Este archivo lo copia build.py a web/difunde.js y heavywork/web/difunde.js: edítalo aquí, en src/.

   Uso: <div data-difunde data-texto="…" data-url="https://…" data-asunto="…"></div>
   El mensaje que se envía es: texto + enlace + la firma «Made with love from Mallorca ❤️». */
(function(){
  'use strict';
  var FIRMA = 'Made with love from Mallorca ❤️';
  var MOVIL = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  var ICONOS = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path fill="#fff" d="M17.3 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.9 7.9 0 0 1-3.9-3.4c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.5-.3z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#229ED9"/><path fill="#fff" d="M5.5 11.8l11.6-4.5c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1 .5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.7-.6.1-.9z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" fill="#E24848"/><path d="M3 7l9 6 9-6" fill="none" stroke="#fff" stroke-width="2"/></svg>',
    copia: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 16V5a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  };
  var CSS = '.difunde-bts{display:flex;flex-wrap:wrap;gap:10px}' +
    '.dif{display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:10px 16px;border:2px solid currentColor;' +
    'background:transparent;color:inherit;font:inherit;font-weight:700;font-size:.95rem;text-decoration:none;cursor:pointer;border-radius:0}' +
    '.dif svg{width:22px;height:22px;flex:none}.dif:hover{background:rgba(127,127,127,.14)}' +
    '@media(max-width:560px){.dif{flex:1 1 calc(50% - 5px);justify-content:center}}';

  function enlace(clase, href, icono, texto){
    var a = document.createElement('a');
    a.className = 'dif dif-' + clase; a.href = href; a.innerHTML = ICONOS[icono];
    a.appendChild(document.createTextNode(texto));
    if (href.indexOf('mailto:') !== 0){ a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  function boton(clase, icono, texto){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dif dif-' + clase; b.innerHTML = ICONOS[icono];
    var s = document.createElement('span'); s.textContent = texto; b.appendChild(s);
    return b;
  }

  function montar(el){
    var texto = el.getAttribute('data-texto') || document.title;
    var url = el.getAttribute('data-url') || location.href;
    var asunto = el.getAttribute('data-asunto') || document.title;
    var mensaje = texto + '\n👉 ' + url + '\n\n' + FIRMA;
    var E = encodeURIComponent;
    var cont = document.createElement('div'); cont.className = 'difunde-bts';
    // En el móvil se abre la app de WhatsApp directamente (wa.me pasa por una web intermedia
    // y a veces se queda ahí sin enviar). Si la app no está, a los 1,5 s va a la web de WhatsApp.
    var waWeb = 'https://api.whatsapp.com/send?text=' + E(mensaje);
    var wa = enlace('wa', MOVIL ? 'whatsapp://send?text=' + E(mensaje) : waWeb, 'wa', 'WhatsApp');
    if (MOVIL){
      wa.removeAttribute('target');
      wa.addEventListener('click', function(){
        var fuera = false;
        var marcha = function(){ if (document.hidden) fuera = true; };
        document.addEventListener('visibilitychange', marcha);
        setTimeout(function(){
          document.removeEventListener('visibilitychange', marcha);
          if (!fuera && !document.hidden) location.href = waWeb;
        }, 1500);
      });
    }
    cont.appendChild(wa);
    cont.appendChild(enlace('tg', 'https://t.me/share/url?url=' + E(url) + '&text=' + E(texto + '\n\n' + FIRMA), 'tg', 'Telegram'));
    cont.appendChild(enlace('mail', 'mailto:?subject=' + E(asunto) + '&body=' + E(mensaje), 'mail', 'Correo'));
    var copia = boton('copia', 'copia', 'Copiar mensaje');
    copia.addEventListener('click', function(){
      var s = copia.querySelector('span');
      var hecho = function(){ s.textContent = '¡Copiado!'; setTimeout(function(){ s.textContent = 'Copiar mensaje'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mensaje).then(hecho, function(){ window.prompt('Copia el mensaje:', mensaje); });
      else window.prompt('Copia el mensaje:', mensaje);
    });
    cont.appendChild(copia);
    if (navigator.share){
      var mas = boton('mas', 'mas', 'Más apps');
      mas.addEventListener('click', function(){
        navigator.share({ title: asunto, text: texto + '\n\n' + FIRMA, url: url }).catch(function(){});
      });
      cont.appendChild(mas);
    }
    el.innerHTML = ''; el.appendChild(cont);
  }

  if (!document.getElementById('difunde-css')){
    var st = document.createElement('style'); st.id = 'difunde-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-difunde]'), montar);
})();
