/* ArnoldWork · idioma: Español / English. Lo genera build.py a partir de src/idioma/en.json: no lo edites en web/.
   Los textos se buscan tal cual aparecen en la página; los de contenido dinámico, con las reglas de «reglas». */
(function(){
  var T = /*TEXTOS*/{};
  var R = /*REGLAS*/[];
  var RR = R.map(function(r){ return [new RegExp(r[0]), r[1]]; });
  var CLAVE = 'arnoldwork-idioma';
  var idioma = 'es';
  try { idioma = localStorage.getItem(CLAVE) === 'en' ? 'en' : 'es'; } catch (e) {}

  function limpio(s){ return s.replace(/\s+/g, ' ').trim(); }
  function traducir(s){
    var k = limpio(s);
    if (T[k]) return T[k];
    for (var i = 0; i < RR.length; i++) if (RR[i][0].test(k)) return k.replace(RR[i][0], RR[i][1]);
    return null;
  }
  var ocultos = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1 };
  function recorrer(raiz){
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var el = n.parentElement;
      if (!el || ocultos[el.tagName]) continue;
      if (n.awOrig === undefined) {
        if (idioma !== 'en' || !traducir(n.textContent)) continue;
        n.awOrig = n.textContent;
      }
      var m = n.awOrig.match(/^(\s*)([\s\S]*?)(\s*)$/);
      var en = idioma === 'en' ? traducir(m[2]) : null;
      var nuevo = en ? m[1] + en + m[3] : n.awOrig;
      if (n.textContent !== nuevo) n.textContent = nuevo;
    }
  }

  var mo = new MutationObserver(function(){
    if (idioma !== 'en') return;
    mo.disconnect();
    recorrer(document.body);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  });

  function fijar(l){
    idioma = l;
    try { localStorage.setItem(CLAVE, l); } catch (e) {}
    document.documentElement.lang = l;
    var t = document.documentElement.dataset.awTitulo || (document.documentElement.dataset.awTitulo = document.title);
    document.title = l === 'en' ? (traducir(t) || t) : t;
    recorrer(document.body);
    document.querySelectorAll('[data-idioma]').forEach(function(b){
      if (b.closest('.idiomas')) b.setAttribute('aria-pressed', String(b.dataset.idioma === l));
    });
    if (l === 'en') mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    else mo.disconnect();
  }

  function estilo(){
    if (document.getElementById('aw-idioma-css')) return;
    var s = document.createElement('style');
    s.id = 'aw-idioma-css';
    s.textContent = '.idiomas{display:inline-flex;margin-left:8px;border:2px solid currentColor;border-radius:6px;overflow:hidden;vertical-align:middle}' +
      '.idiomas button{background:none;color:inherit;border:0;font:700 .78rem/1 inherit;padding:7px 10px;cursor:pointer}' +
      '.idiomas button[aria-pressed="true"]{background:#DE3A3A;color:#fff}' +
      '@media (max-width:600px){.nav .ir-inicio{display:none}.idiomas{margin-left:6px}.idiomas button{padding:6px 8px}}';
    document.head.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', function(){
    estilo();
    document.querySelectorAll('.idiomas [data-idioma]').forEach(function(b){
      b.addEventListener('click', function(){ fijar(b.dataset.idioma); });
    });
    if (idioma === 'en') fijar('en');
    else document.querySelectorAll('.idiomas [data-idioma]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.idioma === 'es')); });
  });
})();
