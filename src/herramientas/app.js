(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var r05 = function(n){ return Math.round(n * 2) / 2; };            // al medio kilo
  var kg  = function(n){
    var v = Math.round(n * 100) / 100;
    var t = v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return t.replace('.', ',') + ' kg';
  };
  var dec = function(n, d){ return n.toFixed(d).replace('.', ','); };
  var miles = function(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var num = function(id){ return parseFloat($(id).value); };
  var ent = function(id){ var v = $(id).value; return v === '' ? NaN : parseInt(v, 10); };
  var each = function(list, fn){ Array.prototype.forEach.call(list, fn); };
  var est = function(w, r){ return r <= 1 ? w : (w * (1 + r / 30) + w * 36 / (37 - r)) / 2; }; // Epley + Brzycki

  /* ---------- guardar en el móvil (si se puede) ---------- */
  var LS = (function(){ try{ var k = 'aw.t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; }catch(e){ return null; } })();
  function sget(k){ if(!LS) return null; try{ return LS.getItem('aw.' + k); }catch(e){ return null; } }
  function sset(k, v){ if(!LS) return; try{ LS.setItem('aw.' + k, v); }catch(e){} }
  function tiene(sel, v){ if(sel.tagName !== 'SELECT') return true; for(var i = 0; i < sel.options.length; i++){ if(sel.options[i].value === v) return true; } return false; }

  // Cada página puede llevar solo algunas herramientas: lo que no está en la página se salta.
  var TITULO = document.title;
  function on(id, ev, fn){ var el = $(id); if(el) el.addEventListener(ev, fn); }
  var CALCS = [];
  function recalc(){ CALCS.forEach(function(f){ try{ f(); }catch(e){} }); }
  function reg(fn, ids){
    if(!ids.every(function(id){ return $(id); })) return;
    CALCS.push(fn);
    ids.forEach(function(id){ $(id).addEventListener('input', fn); $(id).addEventListener('change', fn); });
  }

  each(document.querySelectorAll('[data-keep]'), function(el){
    var v = sget('f.' + el.id);
    if(v !== null && tiene(el, v)) el.value = v;
    var save = function(){ sset('f.' + el.id, el.value); };
    el.addEventListener('input', save); el.addEventListener('change', save);
  });
  var SYNC = {};
  each(document.querySelectorAll('[data-sync]'), function(el){
    var k = el.getAttribute('data-sync');
    (SYNC[k] = SYNC[k] || []).push(el);
  });
  Object.keys(SYNC).forEach(function(k){
    var v = sget('s.' + k);
    if(v !== null) SYNC[k].forEach(function(el){ if(tiene(el, v)) el.value = v; });
    SYNC[k].forEach(function(el){
      var go = function(){
        SYNC[k].forEach(function(o){ if(o !== el && tiene(o, el.value)) o.value = el.value; });
        sset('s.' + k, el.value);
        recalc();
      };
      el.addEventListener('input', go); el.addEventListener('change', go);
    });
  });

  /* ---------- sonido y pantalla encendida ---------- */
  var ctx = null;
  function audio(){
    try{ ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if(ctx.state === 'suspended') ctx.resume(); }catch(e){}
    return ctx;
  }
  function beep(freq, dur, when, vol){
    var c = audio(); if(!c) return;
    try{
      var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    }catch(e){}
  }
  function pita(){
    [0, 0.28, 0.56].forEach(function(t){ beep(880, 0.18, t); });
    if(navigator.vibrate){ try{ navigator.vibrate([200, 100, 200]); }catch(e){} }
  }
  var wl = null, locks = {};
  function pedirLuz(){
    if(!('wakeLock' in navigator) || wl) return;
    navigator.wakeLock.request('screen').then(function(l){
      wl = l; l.addEventListener('release', function(){ wl = null; });
    }).catch(function(){});
  }
  function luz(nombre, on){
    locks[nombre] = on;
    var alguno = Object.keys(locks).some(function(k){ return locks[k]; });
    if(alguno) pedirLuz();
    else if(wl){ try{ wl.release(); }catch(e){} wl = null; }
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible' && Object.keys(locks).some(function(k){ return locks[k]; })) pedirLuz();
  });

  /* ---------- compartir como imagen ---------- */
  function descargar(blob, nombre){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function tarjeta(o){
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
    var x = c.getContext('2d');
    function ajusta(txt, max, px, peso, fam){
      x.font = peso + ' ' + px + 'px ' + fam;
      while(x.measureText(txt).width > max && px > 20){ px -= 4; x.font = peso + ' ' + px + 'px ' + fam; }
    }
    function pinta(){
      x.fillStyle = '#0A0A0A'; x.fillRect(0, 0, 1080, 1080);
      x.strokeStyle = 'rgba(244,242,239,0.05)'; x.lineWidth = 2;
      for(var y = 48; y < 1080; y += 48){ x.beginPath(); x.moveTo(0, y); x.lineTo(1080, y); x.stroke(); }
      x.fillStyle = '#DE3A3A'; x.fillRect(0, 0, 1080, 16);
      var img = document.querySelector('.brand img');
      try{ x.drawImage(img, 80, 84, 60, 78); }catch(e){}
      x.textBaseline = 'alphabetic';
      x.font = '60px "Archivo Black", Impact, sans-serif';
      x.fillStyle = '#F4F2EF'; x.fillText('Arnold', 160, 150);
      var w = x.measureText('Arnold').width;
      x.fillStyle = '#DE3A3A'; x.fillText('Work', 160 + w, 150);

      x.fillStyle = '#A9A9A9'; ajusta(o.titulo.toUpperCase(), 920, 38, '700', 'Archivo, sans-serif');
      x.fillText(o.titulo.toUpperCase(), 80, 300);
      x.fillStyle = '#F4F2EF'; ajusta(o.grande, 920, 150, '400', '"Archivo Black", Impact, sans-serif');
      x.fillText(o.grande, 76, 460);
      x.fillStyle = '#DE3A3A'; ajusta(o.sub, 920, 40, '700', 'Archivo, sans-serif');
      x.fillText(o.sub, 80, 530);
      x.fillStyle = '#F4F2EF';
      (o.lineas || []).slice(0, 5).forEach(function(l, i){
        ajusta(l, 920, 40, '500', 'Archivo, sans-serif');
        x.fillText(l, 80, 650 + i * 64);
      });
      x.fillStyle = 'rgba(244,242,239,0.3)'; x.fillRect(80, 960, 920, 2);
      x.fillStyle = '#A9A9A9'; x.font = '600 32px Archivo, sans-serif';
      x.fillText('arnoldwork.com/herramientas · gratis y sin registro', 80, 1020);
    }
    function sale(){
      pinta();
      c.toBlob(function(b){
        if(!b) return;
        var f = null;
        try{ f = new File([b], o.archivo, { type: 'image/png' }); }catch(e){}
        if(f && navigator.canShare && navigator.canShare({ files: [f] })){
          navigator.share({ files: [f], title: o.titulo }).catch(function(e){
            if(!e || e.name !== 'AbortError') descargar(b, o.archivo);
          });
        } else descargar(b, o.archivo);
      }, 'image/png');
    }
    if(document.fonts && document.fonts.load){
      Promise.all([document.fonts.load('60px "Archivo Black"'), document.fonts.load('700 38px Archivo'), document.fonts.load('500 40px Archivo')]).then(sale, sale);
    } else sale();
  }

  /* ---------- 1RM ---------- */
  var PCT = [95, 90, 85, 80, 75, 70, 65, 60];
  var REPS_PCT = { 95:'2', 90:'3-4', 85:'5-6', 80:'7-8', 75:'9-10', 70:'11-12', 65:'14-15', 60:'17-18' };
  var ultRM = null;

  function calcRM(){
    var w = parseFloat($('rmPeso').value), reps = parseInt($('rmReps').value, 10);
    var out = $('rmOut'), sub = $('rmSub'), warn = $('rmWarn'), tabla = $('rmTabla');
    ultRM = null;
    if(!(w > 0) || !(reps >= 1) || reps > 36){
      out.textContent = '—'; out.appendChild(sub);
      sub.textContent = 'Escribe tus datos arriba';
      warn.hidden = true; tabla.hidden = true; return;
    }
    var rm = est(w, reps);
    ultRM = { rm: rm, w: w, reps: reps };
    out.textContent = kg(r05(rm));
    out.appendChild(sub);
    sub.textContent = reps === 1 ? 'Ese es tu máximo real de hoy' : 'Máximo estimado a partir de ' + reps + ' repeticiones';

    if(reps > 12){
      warn.hidden = false;
      warn.textContent = 'Por encima de 12 repeticiones la estimación se dispara. Para saber tu máximo de verdad, prueba con una serie de 3 a 6.';
    } else { warn.hidden = true; }

    var tb = tabla.querySelector('tbody');
    tb.innerHTML = '';
    PCT.forEach(function(p){
      var tr = document.createElement('tr');
      var c1 = document.createElement('td'); c1.textContent = p + ' %';
      var c2 = document.createElement('td'); c2.textContent = kg(r05(rm * p / 100));
      var c3 = document.createElement('td'); c3.textContent = REPS_PCT[p];
      tr.appendChild(c1); tr.appendChild(c2); tr.appendChild(c3);
      tb.appendChild(tr);
    });
    tabla.hidden = false;
  }
  reg(calcRM, ['rmPeso', 'rmReps']);
  on('rmShare', 'click', function(){
    if(!ultRM) return;
    var rm = ultRM.rm;
    tarjeta({
      titulo: 'Mi máximo estimado (1RM)',
      grande: kg(r05(rm)),
      sub: 'Con ' + kg(ultRM.w) + ' × ' + ultRM.reps + (ultRM.reps === 1 ? ' repetición' : ' repeticiones'),
      lineas: [
        '90 %  →  ' + kg(r05(rm * .9)) + '  ·  3-4 reps',
        '80 %  →  ' + kg(r05(rm * .8)) + '  ·  7-8 reps',
        '70 %  →  ' + kg(r05(rm * .7)) + '  ·  11-12 reps'
      ],
      archivo: 'mi-1rm-arnoldwork.png'
    });
  });

  /* ---------- ¿subo peso? ---------- */
  function calcSubir(){
    var w = num('sPeso'), rg = $('sRango').value.split('-'), lo = +rg[0], hi = +rg[1];
    var inc = parseFloat($('sTipo').value);
    var r1 = ent('sR1'), r2 = ent('sR2'), r3 = ent('sR3');
    var tag = $('sTag'), big = $('sBig'), txt = $('sTxt');
    var pon = function(t, cls, b, x){ tag.textContent = t; tag.className = 'vtag ' + cls; big.textContent = b; txt.innerHTML = x; };
    if(!(w > 0) || isNaN(r3)){
      pon('—', '', '—', 'Mete al menos el peso y las repeticiones de tu última sesión.'); return;
    }
    var maquina = inc === 1, mancu = inc === 2;
    var paso = mancu ? 1 : (inc === 5 ? 2.5 : 2.5);
    var peso = function(v){ return kg(v) + (mancu ? ' por mancuerna' : ''); };
    var baja10 = Math.max(paso, Math.round(w * 0.9 / paso) * paso);

    if(r3 >= hi){
      var saltos = r3 >= hi + 4 ? 2 : 1;
      var nuevo = maquina ? (saltos === 2 ? 'Dos placas más' : 'Una placa más') : peso(w + inc * saltos);
      pon('SUBE', 'up', nuevo,
        'Has hecho <strong>' + r3 + ' repeticiones</strong>, el techo de tu rango de ' + lo + ' a ' + hi + '. ' +
        (saltos === 2 ? 'Te ha sobrado mucho, así que puedes dar dos saltos de golpe. ' : '') +
        'Con el peso nuevo espera hacer unas ' + lo + ' o ' + (lo + 1) + ': es normal bajar de repeticiones. Cuando vuelvas a llegar a ' + hi + ', subes otra vez.');
      return;
    }
    if(r3 < lo){
      if(!isNaN(r2) && r2 < lo){
        pon('BAJA', 'down', maquina ? 'Baja una o dos placas' : peso(baja10),
          'Dos sesiones seguidas por debajo de ' + lo + ' repeticiones: ese peso todavía te queda grande. ' +
          'Baja un 10 %, vuelve a construir hasta ' + hi + ' repeticiones y sube de nuevo. No es retroceder, es tomar carrerilla.');
      } else {
        pon('MANTÉN', 'hold', maquina ? 'Mismo peso' : peso(w),
          'Esta vez te has quedado en ' + r3 + ', por debajo de ' + lo + '. Una mala sesión la tiene cualquiera: repite el peso. Si la próxima vuelve a quedarse corta, baja un 10 %.');
      }
      return;
    }
    if(!isNaN(r1) && !isNaN(r2) && r3 <= r2 && r2 <= r1){
      pon('ESTANCADO', 'down', maquina ? 'Mismo peso' : peso(w),
        'Tres sesiones sin sumar ni una repetición. Antes de tocar el peso, repasa lo básico: <strong>duermes 7 horas o más, comes proteína suficiente y descansas entre sesiones</strong>. ' +
        'Si todo eso está en orden, baja un 10 %' + (maquina ? '' : ' (' + peso(baja10) + ')') + ' y vuelve a subir desde ahí.');
      return;
    }
    var bien = (!isNaN(r2) && r3 > r2) ? 'Vas bien: ' + (r3 - r2 === 1 ? 'una repetición más' : (r3 - r2) + ' repeticiones más') + ' que la sesión anterior. ' : '';
    pon('MANTÉN', 'hold', maquina ? 'Mismo peso' : peso(w),
      bien + 'Estás dentro de tu rango. Mismo peso y busca <strong>' + (r3 + 1) + ' repeticiones</strong> la próxima vez. Cuando llegues a ' + hi + ', subes.');
  }
  reg(calcSubir, ['sPeso', 'sRango', 'sTipo', 'sR1', 'sR2', 'sR3']);

  /* ---------- ¿cómo de fuerte soy? ---------- */
  var STD = {
    h: { sq: [0.75, 1.25, 1.5, 2.25, 2.75], bp: [0.5, 0.75, 1.0, 1.5, 1.9], dl: [1.0, 1.5, 1.75, 2.5, 3.0] },
    m: { sq: [0.5, 0.75, 1.0, 1.5, 1.9],    bp: [0.25, 0.5, 0.65, 1.0, 1.3], dl: [0.6, 1.0, 1.25, 1.75, 2.25] }
  };
  var LVL = ['Empezando', 'Principiante', 'Novato', 'Intermedio', 'Avanzado', 'Élite'];
  var LIFTS = [ { k: 'sq', n: 'Sentadilla', id: 'fSq' }, { k: 'bp', n: 'Press banca', id: 'fBp' }, { k: 'dl', n: 'Peso muerto', id: 'fDl' } ];
  var ultNivel = null;

  function calcNivel(){
    var sx = $('fSexo').value, bw = num('fPeso'), out = $('fOut');
    out.innerHTML = ''; ultNivel = null;
    if(!(bw > 0)){ out.innerHTML = '<p class="vtxt">Escribe tu peso corporal.</p>'; return; }
    var total = 0, idxs = [], lineas = [];
    LIFTS.forEach(function(L){
      var k = num(L.id + 'K'), r = ent(L.id + 'R');
      var box = document.createElement('div'); box.className = 'lv';
      if(!(k > 0) || !(r >= 1)){
        box.innerHTML = '<div class="lv-h"><b>' + L.n + '</b><span style="color:var(--chalk-dim)">sin datos</span></div>';
        out.appendChild(box); return;
      }
      var e = est(k, Math.min(r, 12)), ratio = e / bw, t = STD[sx][L.k], idx = 0;
      t.forEach(function(v){ if(ratio >= v) idx++; });
      total += e; idxs.push(idx);
      var pos;
      if(ratio < t[0]) pos = 0;
      else if(idx >= 5) pos = Math.min(5, 4 + (ratio - t[4]) / (t[4] * 0.2));
      else pos = (idx - 1) + (ratio - t[idx - 1]) / (t[idx] - t[idx - 1]);
      var segs = '';
      for(var i = 0; i < 5; i++) segs += '<i' + (i < idx ? ' class="on"' : '') + '></i>';
      var falta = idx < 5
        ? 'Te faltan <strong style="color:var(--chalk)">' + kg(Math.max(0.5, r05(t[idx] * bw - e))) + '</strong> de máximo para ' + LVL[idx + 1] + '.'
        : 'Nivel élite. Muy poca gente llega aquí sin años de trabajo.';
      box.innerHTML =
        '<div class="lv-h"><b>' + L.n + ' · ' + kg(r05(e)) + ' <small style="font-family:Archivo;color:var(--chalk-dim);font-size:.85rem">(' + dec(ratio, 2) + ' × tu peso)</small></b><span>' + LVL[idx] + '</span></div>' +
        '<div class="lv-bar">' + segs + '<em style="left:calc(' + (pos / 5 * 100) + '% - 1px)"></em></div>' +
        '<div class="lv-s"><span>Principiante</span><span>Novato</span><span>Intermedio</span><span>Avanzado</span><span>Élite</span></div>' +
        '<p>' + falta + '</p>';
      out.appendChild(box);
      lineas.push(L.n + ': ' + kg(r05(e)) + ' · ' + LVL[idx]);
    });
    if(idxs.length){
      var media = Math.floor(idxs.reduce(function(a, b){ return a + b; }, 0) / idxs.length);
      var s = document.createElement('p'); s.className = 'lv-sum';
      s.innerHTML = 'Tu nivel general: <strong style="color:var(--amber)">' + LVL[media] + '</strong>' +
        (idxs.length === 3 ? ' · Total de los tres: <strong>' + kg(r05(total)) + '</strong> (' + dec(total / bw, 2) + ' × tu peso)' : '');
      out.appendChild(s);
      ultNivel = { nivel: LVL[media], total: total, n: idxs.length, lineas: lineas };
    }
  }
  reg(calcNivel, ['fSexo', 'fPeso', 'fSqK', 'fSqR', 'fBpK', 'fBpR', 'fDlK', 'fDlR']);
  on('fShare', 'click', function(){
    if(!ultNivel) return;
    tarjeta({
      titulo: 'Mi nivel de fuerza',
      grande: ultNivel.nivel,
      sub: ultNivel.n === 3 ? 'Total de los tres básicos: ' + kg(r05(ultNivel.total)) : 'Según mis básicos',
      lineas: ultNivel.lineas,
      archivo: 'mi-nivel-arnoldwork.png'
    });
  });

  /* ---------- discos ---------- */
  var DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25];

  function montar(porLado){
    var quedan = porLado, usados = [];
    DISCOS.forEach(function(d){
      while(quedan >= d - 0.001){ usados.push(d); quedan = Math.round((quedan - d) * 1000) / 1000; }
    });
    return { usados: usados, sobra: quedan };
  }

  function calcDiscos(){
    var total = parseFloat($('dTotal').value);
    var barra = parseFloat($('dBarra').value);
    var out = $('dOut'), sub = $('dSub'), cont = $('dPlates'), warn = $('dWarn');
    cont.innerHTML = '';
    if(!(total > 0)){
      out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Por lado';
      warn.hidden = true; return;
    }
    var porLado = barra === 0 ? total : (total - barra) / 2;
    if(porLado < 0){
      out.textContent = '—'; out.appendChild(sub);
      sub.textContent = 'Por lado';
      warn.hidden = false;
      warn.textContent = 'La barra sola ya pesa ' + kg(barra) + '. Sube el peso total.';
      return;
    }
    var m = montar(porLado);
    var real = barra + (barra === 0 ? m.usados.reduce(function(a,b){return a+b;},0)
                                    : m.usados.reduce(function(a,b){return a+b;},0) * 2);
    out.textContent = kg(porLado - m.sobra);
    out.appendChild(sub);
    sub.textContent = barra === 0 ? 'Discos por lado' : 'Por lado, más la barra de ' + kg(barra);

    if(!m.usados.length){
      cont.textContent = 'Solo la barra.';
    } else {
      m.usados.forEach(function(d){
        var el = document.createElement('div');
        el.className = 'disc' + (d < 5 ? ' s' : '');
        el.style.height = (28 + d * 1.6) + 'px';
        el.textContent = String(d).replace('.', ',');
        el.title = d + ' kg';
        cont.appendChild(el);
      });
    }
    if(m.sobra > 0.001){
      warn.hidden = false;
      warn.textContent = 'Con discos normales no sale exacto: lo más cerca son ' + kg(real) + ' en total.';
    } else { warn.hidden = true; }
  }
  reg(calcDiscos, ['dTotal', 'dBarra']);

  /* ---------- series de aproximación ---------- */
  var PLAN_WU = {
    hip: [[0.5, 8], [0.7, 4], [0.85, 1]],
    hd:  [[0.4, 8], [0.6, 5], [0.75, 3], [0.85, 2], [0.92, 1]]
  };
  function calcCalent(){
    var W = num('cPeso'), bar = parseFloat($('cBarra').value), tipo = $('cTipo').value;
    var tb = $('cTabla').querySelector('tbody'); tb.innerHTML = '';
    var fila = function(a, b, c, d, cls){
      var tr = document.createElement('tr'); if(cls) tr.className = cls;
      [a, b, c, d].forEach(function(v){ var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      tb.appendChild(tr);
    };
    var lado = function(t){ var m = montar((t - bar) / 2); return m.usados.length ? m.usados.map(function(d){ return String(d).replace('.', ','); }).join(' + ') : 'solo la barra'; };
    if(!(W > 0)){ fila('—', 'Escribe tu peso de trabajo', '', ''); return; }
    if(W <= bar + 5){ fila('1', kg(bar), '10', 'solo la barra'); fila('Efectiva', kg(W), '', lado(W), 'eff'); return; }
    var n = 1, prev = bar;
    fila(String(n++), kg(bar), '10', 'solo la barra');
    PLAN_WU[tipo].forEach(function(p){
      var t = bar + Math.round((W * p[0] - bar) / 2.5) * 2.5;
      if(t <= prev || t >= W) return;
      fila(String(n++), kg(t), String(p[1]), lado(t));
      prev = t;
    });
    var m = montar((W - bar) / 2);
    fila('Efectiva', kg(W), tipo === 'hd' ? 'al fallo' : 'tu rango', m.sobra > 0.001 ? lado(W) + ' (no exacto)' : lado(W), 'eff');
  }
  reg(calcCalent, ['cPeso', 'cBarra', 'cTipo']);

  /* ---------- calorías y macros ---------- */
  var OBJ = {
    def: { adj: -0.20, p: 2.2, n: 'Perder grasa' },
    rec: { adj: -0.10, p: 2.0, n: 'Recomposición' },
    man: { adj: 0,     p: 1.8, n: 'Mantener' },
    vol: { adj: 0.10,  p: 1.8, n: 'Ganar músculo' }
  };
  var ultMac = null;
  function calcMacros(){
    var sx = $('mSexo').value, edad = num('mEdad'), p = num('mPeso'), h = num('mAltura'), act = num('mAct'), ok = $('mObj').value;
    var out = $('mOut'), sub = $('mSub'), warn = $('mWarn'), tiles = $('mTiles'), dia = $('mDia');
    ultMac = null; tiles.innerHTML = ''; dia.textContent = ''; warn.hidden = true;
    if(!(edad > 0) || !(p > 0) || !(h > 0)){
      out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Rellena edad, peso y altura'; return;
    }
    var avisos = [];
    if(edad < 18 && (ok === 'def' || ok === 'rec')){
      ok = 'man';
      avisos.push('Con menos de 18 años no te propongo comer por debajo de lo que gastas: estás creciendo y lo necesitas para entrenar. Te enseño las calorías para mantener. Si te preocupa tu peso, háblalo con tu médico.');
    }
    var o = OBJ[ok];
    var bmr = 10 * p + 6.25 * h - 5 * edad + (sx === 'h' ? 5 : -161);
    var tdee = bmr * act;
    var kcal = tdee * (1 + o.adj);
    var suelo = Math.max(bmr, sx === 'h' ? 1500 : 1200);
    if(kcal < suelo){
      kcal = suelo;
      avisos.push('He subido las calorías a un mínimo razonable: por debajo de esto no te lo recomiendo sin alguien que te siga de cerca.');
    }
    kcal = Math.round(kcal / 10) * 10;
    var pr = Math.round(Math.min(p * o.p, 230));
    var gr = Math.round(Math.max(0.8 * p, kcal * 0.25 / 9));
    gr = Math.min(gr, Math.round(kcal * 0.35 / 9));
    var hc = Math.max(0, Math.round((kcal - pr * 4 - gr * 9) / 4));

    out.textContent = miles(kcal) + ' kcal';
    out.appendChild(sub);
    sub.textContent = 'Al día · tu mantenimiento son unas ' + miles(Math.round(tdee / 10) * 10) + ' kcal';
    if(avisos.length){ warn.hidden = false; warn.textContent = avisos.join(' '); }

    [['Proteína', pr, dec(pr / p, 1) + ' g por kg'], ['Hidratos', hc, Math.round(hc * 4 / kcal * 100) + ' % de las calorías'], ['Grasa', gr, Math.round(gr * 9 / kcal * 100) + ' % de las calorías']]
      .forEach(function(m){
        var d = document.createElement('div');
        d.innerHTML = '<p class="k">' + m[0] + '</p><b>' + m[1] + ' g</b><span>' + m[2] + '</span>';
        tiles.appendChild(d);
      });

    var dif = kcal - tdee, sem = dif * 7 / 7700;
    var ritmo = Math.abs(sem) < 0.05
      ? 'Con esto deberías mantener el peso.'
      : 'Ritmo esperado: unos <strong>' + (sem > 0 ? '+' : '−') + dec(Math.abs(sem), 2) + ' kg por semana</strong>.' +
        (sem < 0 ? ' Si pierdes más de un 1 % de tu peso a la semana, come un poco más: estarías perdiendo músculo también.' : ' Si subes más rápido, recorta un poco: el resto sería grasa.');

    var resto = pr - 3 * 6.5 - 15 - 25, pollo = 0, batido = 0, atun = 0;
    if(resto > 0){ pollo = Math.min(3, Math.floor(resto / 33)); resto -= pollo * 33; }
    if(resto > 8){ batido = Math.min(2, Math.ceil(resto / 24)); resto -= batido * 24; }
    if(resto > 8){ atun = Math.ceil(resto / 20); }
    var trozos = ['3 huevos'];
    if(pollo) trozos.push(pollo + (pollo === 1 ? ' filete' : ' filetes') + ' de pollo de 150 g');
    trozos.push('un yogur proteico');
    if(batido) trozos.push(batido === 1 ? 'un batido de proteína' : batido + ' batidos de proteína');
    if(atun) trozos.push(atun === 1 ? 'una lata de atún' : atun + ' latas de atún');
    var lista = trozos.slice(0, -1).join(', ') + ' y ' + trozos[trozos.length - 1];
    dia.innerHTML = ritmo + '<br><br>¿Cómo se ve la proteína en el plato? Un día que llega a unos ' + pr + ' g sería, por ejemplo: ' + lista +
      ', más lo que aportan el pan, el arroz y las legumbres del resto de comidas.';

    ultMac = { kcal: kcal, pr: pr, hc: hc, gr: gr, obj: o.n };
  }
  reg(calcMacros, ['mSexo', 'mEdad', 'mPeso', 'mAltura', 'mAct', 'mObj']);
  on('mShare', 'click', function(){
    if(!ultMac) return;
    tarjeta({
      titulo: 'Mis calorías y macros',
      grande: miles(ultMac.kcal) + ' kcal',
      sub: 'Al día · objetivo: ' + ultMac.obj.toLowerCase(),
      lineas: ['Proteína: ' + ultMac.pr + ' g', 'Hidratos: ' + ultMac.hc + ' g', 'Grasa: ' + ultMac.gr + ' g'],
      archivo: 'mis-macros-arnoldwork.png'
    });
  });

  /* ---------- grasa corporal y FFMI ---------- */
  var CAT_BF = {
    h: [[6, 'Muy bajo: nivel de competición, difícil de mantener'], [14, 'Atlético'], [18, 'En forma'], [25, 'Dentro de la media'], [999, 'Por encima de la media']],
    m: [[14, 'Muy bajo: nivel de competición, difícil de mantener'], [21, 'Atlético'], [25, 'En forma'], [32, 'Dentro de la media'], [999, 'Por encima de la media']]
  };
  var CAT_FFMI = {
    h: [[18, 'por debajo de la media'], [20, 'en la media'], [22, 'por encima de la media: se nota que entrenas'], [25, 'muy musculado'], [99, 'por encima de 25 es rarísimo sin ayudas']],
    m: [[15, 'por debajo de la media'], [17, 'en la media'], [19, 'por encima de la media: se nota que entrenas'], [22, 'muy musculada'], [99, 'por encima de 22 es rarísimo sin ayudas']]
  };
  var busca = function(t, v){ for(var i = 0; i < t.length; i++){ if(v < t[i][0]) return t[i][1]; } return t[t.length - 1][1]; };
  function calcGrasa(){
    var sx = $('gSexo').value, p = num('gPeso'), h = num('gAltura'), cu = num('gCuello'), ci = num('gCintura'), ca = num('gCadera');
    var out = $('gOut'), sub = $('gSub'), warn = $('gWarn'), tabla = $('gTabla');
    $('gCaderaF').hidden = sx !== 'm';
    $('gCinturaL').textContent = sx === 'm' ? 'Cintura, en la parte más estrecha (cm)' : 'Cintura, a la altura del ombligo (cm)';
    warn.hidden = true; tabla.hidden = true;
    var falta = !(p > 0) || !(h > 0) || !(cu > 0) || !(ci > 0) || (sx === 'm' && !(ca > 0));
    var bf = NaN;
    if(!falta){
      if(sx === 'h' && ci > cu) bf = 495 / (1.0324 - 0.19077 * Math.log10(ci - cu) + 0.15456 * Math.log10(h)) - 450;
      if(sx === 'm' && ci + ca > cu) bf = 495 / (1.29579 - 0.35004 * Math.log10(ci + ca - cu) + 0.22100 * Math.log10(h)) - 450;
    }
    if(falta || !(bf > 2 && bf < 60)){
      out.textContent = '—'; out.appendChild(sub); sub.textContent = '';
      if(!falta){ warn.hidden = false; warn.textContent = 'Con esas medidas no sale un resultado creíble. Revisa que el cuello y la cintura estén bien medidos.'; }
      else sub.textContent = 'Rellena todas las medidas';
      return;
    }
    out.textContent = dec(bf, 1) + ' %';
    out.appendChild(sub);
    sub.textContent = busca(CAT_BF[sx], bf);
    var hm = h / 100, grasa = p * bf / 100, magra = p - grasa;
    var ffmi = magra / (hm * hm), ffmiN = ffmi + 6.1 * (1.8 - hm);
    var tb = tabla.querySelector('tbody'); tb.innerHTML = '';
    [['Masa magra', kg(Math.round(magra * 10) / 10)], ['Masa grasa', kg(Math.round(grasa * 10) / 10)],
     ['FFMI', dec(ffmi, 1)], ['FFMI ajustado a tu altura', dec(ffmiN, 1) + ' · ' + busca(CAT_FFMI[sx], ffmiN)]]
      .forEach(function(r){
        var tr = document.createElement('tr');
        var a = document.createElement('td'); a.textContent = r[0];
        var b = document.createElement('td'); b.textContent = r[1];
        tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr);
      });
    tabla.hidden = false;
  }
  reg(calcGrasa, ['gSexo', 'gPeso', 'gAltura', 'gCuello', 'gCintura', 'gCadera']);

  /* ---------- volumen semanal ---------- */
  var MUSC = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Glúteo', 'Gemelos', 'Abdomen'];
  var vol = (function(){
    try{ var a = JSON.parse(sget('vol') || 'null'); if(a && a.length === MUSC.length) return a.map(function(v){ return Math.max(0, Math.min(40, v | 0)); }); }catch(e){}
    return MUSC.map(function(){ return 0; });
  })();
  var estadoVol = function(v){
    if(v === 0) return ['sin series', ''];
    if(v < 6) return ['bajo: solo mantienes', ''];
    if(v < 10) return ['justo: corto para crecer', ''];
    if(v <= 20) return ['en rango', 'ok'];
    return ['mucho: vigila la recuperación', 'hi'];
  };
  function pintaVol(){
    var cont = $('vList'); cont.innerHTML = '';
    MUSC.forEach(function(m, i){
      var v = vol[i], e = estadoVol(v);
      var row = document.createElement('div'); row.className = 'vrow';
      row.innerHTML = '<b>' + m + '</b>' +
        '<div class="stp"><button type="button" aria-label="Una serie menos de ' + m + '">−</button><output aria-live="polite">' + v + '</output><button type="button" aria-label="Una serie más de ' + m + '">+</button></div>' +
        '<div><div class="vmeter"><span class="band"></span><span class="fill ' + e[1] + '" style="width:' + (Math.min(v, 25) / 25 * 100) + '%"></span></div></div>' +
        '<span class="vlab">' + e[0] + '</span>';
      var bs = row.querySelectorAll('button');
      bs[0].addEventListener('click', function(){ vol[i] = Math.max(0, vol[i] - 1); guardaVol(); });
      bs[1].addEventListener('click', function(){ vol[i] = Math.min(40, vol[i] + 1); guardaVol(); });
      cont.appendChild(row);
    });
    var total = vol.reduce(function(a, b){ return a + b; }, 0);
    var res = $('vRes');
    if(!total){ res.innerHTML = 'Pulsa <strong>+</strong> para apuntar tus series de la semana.'; return; }
    var enR = vol.filter(function(v){ return v >= 10 && v <= 20; }).length;
    var cortos = MUSC.filter(function(m, i){ return vol[i] > 0 && vol[i] < 10; });
    var sobr = MUSC.filter(function(m, i){ return vol[i] > 20; });
    var txt = '<strong>' + total + ' series</strong> a la semana. ' + enR + ' de ' + MUSC.length + ' músculos en rango.';
    if(cortos.length) txt += ' Se quedan cortos: ' + cortos.join(', ').toLowerCase() + '.';
    if(sobr.length) txt += ' Van sobrados: ' + sobr.join(', ').toLowerCase() + '.';
    res.innerHTML = txt;
  }
  function guardaVol(){ sset('vol', JSON.stringify(vol)); pintaVol(); }
  on('vReset', 'click', function(){ vol = MUSC.map(function(){ return 0; }); guardaVol(); });

  /* ---------- recuperación Heavy Duty ---------- */
  var ROT = [ { k: 'A', n: 'Pecho y espalda' }, { k: 'B', n: 'Piernas' }, { k: 'C', n: 'Hombros y brazos' }, { k: 'D', n: 'Piernas' } ];
  var hdLog = (function(){ try{ var a = JSON.parse(sget('hd') || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } })();
  var hoyISO = function(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var partes = function(s){ var p = s.split('-'); return [+p[0], +p[1] - 1, +p[2]]; };
  var dias = function(a, b){ var x = partes(a), y = partes(b); return Math.round((Date.UTC(y[0], y[1], y[2]) - Date.UTC(x[0], x[1], x[2])) / 864e5); };
  var suma = function(s, n){ var x = partes(s); return new Date(x[0], x[1], x[2] + n); };
  var hace = function(n){ return n === 0 ? 'hoy' : n === 1 ? 'ayer' : 'hace ' + n + ' días'; };
  function calcHD(){
    var hoy = hoyISO(), rest = parseInt($('hDesc').value, 10);
    var ult = hdLog.length ? hdLog[hdLog.length - 1] : null;
    var sig = ult ? ROT[(ROT.map(function(r){ return r.k; }).indexOf(ult.k) + 1) % 4] : ROT[0];
    var grid = $('hGrid'); grid.innerHTML = '';
    ROT.forEach(function(r){
      var last = null;
      for(var i = hdLog.length - 1; i >= 0; i--){ if(hdLog[i].k === r.k){ last = hdLog[i]; break; } }
      var c = document.createElement('div'); c.className = 'hd-c' + (r.k === sig.k ? ' next' : '');
      c.innerHTML = '<b>' + r.k + '</b><small>' + r.n + '</small><span class="when">' + (last ? 'Última: ' + hace(dias(last.d, hoy)) : 'Sin hacer todavía') + '</span>';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Hoy he hecho la ' + r.k;
      b.addEventListener('click', function(){
        var u = hdLog[hdLog.length - 1];
        if(u && u.k === r.k && u.d === hoy) return;
        hdLog.push({ k: r.k, d: hoy }); if(hdLog.length > 60) hdLog = hdLog.slice(-60);
        sset('hd', JSON.stringify(hdLog)); calcHD();
      });
      c.appendChild(b); grid.appendChild(c);
    });
    var tag = $('hTag'), big = $('hBig'), txt = $('hTxt');
    if(!ult){
      tag.textContent = 'EMPIEZA'; tag.className = 'vtag up'; big.textContent = 'Rutina A';
      txt.innerHTML = 'Todavía no has marcado ninguna sesión. Empieza por la A (' + ROT[0].n.toLowerCase() + ') y márcala aquí al terminar.';
      return;
    }
    var since = dias(ult.d, hoy);
    if(since >= rest){
      tag.textContent = 'LISTO'; tag.className = 'vtag up'; big.textContent = 'Hoy toca la ' + sig.k;
      txt.innerHTML = 'Tu última sesión fue la ' + ult.k + ', ' + hace(since) + '. Ya has descansado los ' + rest + ' días que te marcaste: toca <strong>' + sig.n.toLowerCase() + '</strong>.';
    } else {
      var f = suma(ult.d, rest), q = rest - since;
      tag.textContent = 'DESCANSA'; tag.className = 'vtag hold';
      big.textContent = q === 1 ? 'Falta 1 día' : 'Faltan ' + q + ' días';
      txt.innerHTML = (since === 0 ? 'Hoy ya has entrenado la ' + ult.k + '. ' : '') +
        'La siguiente es la <strong>' + sig.k + ' (' + sig.n.toLowerCase() + ')</strong>, el ' +
        f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) +
        '. El músculo crece mientras descansas, no mientras entrenas.';
    }
  }
  reg(calcHD, ['hDesc']);
  on('hUndo', 'click', function(){ if(!hdLog.length) return; hdLog.pop(); sset('hd', JSON.stringify(hdLog)); calcHD(); });
  on('hReset', 'click', function(){
    if(!hdLog.length) return;
    if(!window.confirm('¿Borrar todas las sesiones marcadas?')) return;
    hdLog = []; sset('hd', '[]'); calcHD();
  });

  /* ---------- cronómetro ---------- */
  var total = 90, queda = 90, id = null;

  function pinta(){
    var m = Math.floor(queda / 60), s = queda % 60;
    $('tOut').textContent = m + ':' + (s < 10 ? '0' + s : s);
    document.title = id ? (m + ':' + (s < 10 ? '0' + s : s) + ' · descanso') : TITULO;
  }
  function para(){ if(id){ clearInterval(id); id = null; } $('tGo').textContent = 'Empezar'; luz('t', false); }
  function tic(){
    queda--;
    if(queda <= 0){ queda = 0; pinta(); para(); pita(); queda = total; setTimeout(pinta, 1500); return; }
    pinta();
  }
  on('tGo', 'click', function(){
    if(id){ para(); pinta(); return; }
    if(queda <= 0) queda = total;
    audio();
    id = setInterval(tic, 1000);
    $('tGo').textContent = 'Pausa';
    luz('t', true);
    pinta();
  });
  on('tReset', 'click', function(){ para(); queda = total; pinta(); });
  if($('tPresets')) each($('tPresets').querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      each($('tPresets').querySelectorAll('button'), function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      total = parseInt(b.getAttribute('data-s'), 10);
      para(); queda = total; pinta();
    });
  });

  /* ---------- tempo ---------- */
  var tp = null;
  function faseTxt(n, cls){ var f = $('pFase'); f.textContent = n; f.className = 'tempo-ph' + (cls ? ' ' + cls : ''); }
  function barra(v, cls){ var b = $('pBar'); b.style.width = (v * 100) + '%'; b.className = cls || ''; }
  function leeTempo(){
    var g = function(id, lo, hi, def){ var v = parseInt($(id).value, 10); return isNaN(v) ? def : Math.max(lo, Math.min(hi, v)); };
    var fases = [
      { n: 'Baja',   s: g('pBaja', 1, 10, 4),  pos: function(x){ return 1 - x; }, f: 520 },
      { n: 'Pausa',  s: g('pAbajo', 0, 5, 0),  pos: function(){ return 0; },      f: 660 },
      { n: 'Sube',   s: g('pSube', 1, 10, 4),  pos: function(x){ return x; },     f: 880, cls: 'sube' },
      { n: 'Arriba', s: g('pArriba', 0, 5, 0), pos: function(){ return 1; },      f: 660 }
    ].filter(function(f){ return f.s > 0; });
    return { fases: fases, ciclo: fases.reduce(function(a, f){ return a + f.s; }, 0), reps: g('pReps', 1, 30, 8) };
  }
  function paraTempo(msg){
    if(tp){ cancelAnimationFrame(tp.raf); tp = null; }
    $('pGo').textContent = 'Empezar'; luz('p', false);
    if(msg) faseTxt(msg);
  }
  function frameTempo(){
    if(!tp) return;
    var e = (performance.now() - tp.t0) / 1000, C = tp.cfg;
    if(e < 3){
      var n = Math.ceil(3 - e);
      if(tp.last !== 'c' + n){ tp.last = 'c' + n; beep(440, 0.12, 0, 0.3); }
      faseTxt(String(n)); barra(1);
      $('pRep').textContent = '0 / ' + C.reps;
    } else {
      var e2 = e - 3, rep = Math.floor(e2 / C.ciclo);
      if(rep >= C.reps){
        [0, 0.25, 0.5].forEach(function(t){ beep(880, 0.18, t); });
        $('pRep').textContent = C.reps + ' / ' + C.reps;
        barra(1); paraTempo('Hecho'); tp = null; return;
      }
      var dentro = e2 - rep * C.ciclo, acc = 0, fi = 0;
      while(fi < C.fases.length - 1 && dentro >= acc + C.fases[fi].s){ acc += C.fases[fi].s; fi++; }
      var F = C.fases[fi], x = (dentro - acc) / F.s, seg = Math.floor(dentro - acc);
      var key = rep + '-' + fi, keyS = key + '-' + seg;
      if(tp.last !== key && tp.lastS !== keyS){ beep(F.f, 0.14, 0, 0.35); }
      else if(tp.lastS !== keyS){ beep(1200, 0.04, 0, 0.08); }
      tp.last = key; tp.lastS = keyS;
      faseTxt(F.n + (F.s > 1 ? ' · ' + (F.s - seg) : ''), F.cls);
      barra(F.pos(Math.min(1, x)), F.cls);
      $('pRep').textContent = (rep + 1) + ' / ' + C.reps;
    }
    tp.raf = requestAnimationFrame(frameTempo);
  }
  on('pGo', 'click', function(){
    if(tp){
      var hechas = parseInt($('pRep').textContent, 10) || 0;
      paraTempo(hechas > 0 ? 'Parado en la ' + hechas : 'Parado');
      return;
    }
    audio();
    tp = { t0: performance.now(), cfg: leeTempo(), last: null, lastS: null, raf: 0 };
    $('pGo').textContent = 'Parar'; luz('p', true);
    frameTempo();
  });
  function prepTempo(){ if(tp) return; var C = leeTempo(); $('pRep').textContent = '0 / ' + C.reps; faseTxt('Preparado'); barra(1); }
  reg(prepTempo, ['pBaja', 'pAbajo', 'pSube', 'pArriba', 'pReps']);

  /* ---------- RIR y RPE ---------- */
  // Tabla de RPE de Mike Tuchscherer: % del máximo según repeticiones + repeticiones que sobraban (en medios).
  var RPE_T = [100, 97.8, 95.5, 93.9, 92.2, 90.7, 89.2, 87.8, 86.3, 85.0, 83.7, 82.4, 81.1, 79.9, 78.6, 77.4,
               76.2, 75.1, 73.9, 72.3, 70.7, 69.4, 68.0, 66.7, 65.3, 64.0, 62.6, 61.3, 59.9, 58.6, 57.2];
  var rpePct = function(reps, rpe){
    var i = Math.round((reps - 1 + (10 - rpe)) * 2);
    return RPE_T[Math.max(0, Math.min(RPE_T.length - 1, i))] / 100;
  };
  var rpeTxt = function(v){ return String(v).replace('.', ','); };
  function calcRpe(){
    var w = num('rpPeso'), r = ent('rpReps'), e = parseFloat($('rpRpe').value);
    var r2 = ent('rpReps2'), e2 = parseFloat($('rpRpe2').value);
    var out = $('rpOut'), sub = $('rpSub'), warn = $('rpWarn'), tabla = $('rpTabla');
    warn.hidden = true; tabla.hidden = true;
    if(!(w > 0) || !(r >= 1) || !(r2 >= 1)){
      out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Rellena las dos series'; return;
    }
    r = Math.min(r, 12); r2 = Math.min(r2, 12);
    var e1 = w / rpePct(r, e);
    var obj = e1 * rpePct(r2, e2);
    out.textContent = kg(r05(obj)); out.appendChild(sub);
    var sobran = 10 - e2;
    sub.textContent = r2 + (r2 === 1 ? ' repetición' : ' repeticiones') + ' a RPE ' + rpeTxt(e2) +
      (sobran > 0 ? ' (que te sobren ' + rpeTxt(sobran) + ')' : ' (al fallo)') + ' · tu máximo estimado: ' + kg(r05(e1));
    if(r + 10 - e > 10){ warn.hidden = false; warn.textContent = 'Con tantas repeticiones y tanto margen la estimación pierde precisión. Para calcular bien, usa una serie de 3 a 8 repeticiones a RPE 8 o más.'; }
    var tb = tabla.querySelector('tbody'); tb.innerHTML = '';
    [1, 2, 3, 4, 5, 6, 8, 10, 12].forEach(function(n){
      var tr = document.createElement('tr');
      var c = document.createElement('td'); c.textContent = n; tr.appendChild(c);
      [10, 9, 8, 7].forEach(function(p){ var td = document.createElement('td'); td.textContent = kg(r05(e1 * rpePct(n, p))); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    tabla.hidden = false;
  }
  reg(calcRpe, ['rpPeso', 'rpReps', 'rpRpe', 'rpReps2', 'rpRpe2']);

  /* ---------- puntos DOTS y Wilks ---------- */
  var poli = function(c, x){ var s = 0; for(var i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
  var DOTS = {
    h: { c: [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093], lo: 40, hi: 210 },
    m: { c: [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706], lo: 40, hi: 150 }
  };
  var WILKS = {
    h: { c: [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-06, -1.291e-08], lo: 40, hi: 201.9 },
    m: { c: [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-05, -9.054e-08], lo: 26.51, hi: 154.53 }
  };
  var coef = function(t, bw){ return 500 / poli(t.c, Math.max(t.lo, Math.min(t.hi, bw))); };
  var ultPts = null;
  function calcPuntos(){
    var sx = $('dtSexo').value, bw = num('dtPeso'), tot = num('dtTotal');
    var out = $('dtOut'), sub = $('dtSub'), tabla = $('dtTabla'), txt = $('dtTxt');
    tabla.hidden = true; txt.textContent = ''; ultPts = null;
    if(!(bw > 0) || !(tot > 0)){ out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Mete tu peso y tu total'; return; }
    var d = tot * coef(DOTS[sx], bw), w = tot * coef(WILKS[sx], bw);
    out.textContent = dec(d, 1); out.appendChild(sub);
    sub.textContent = 'Puntos DOTS con ' + kg(tot) + ' de total pesando ' + kg(bw);
    var tb = tabla.querySelector('tbody'); tb.innerHTML = '';
    [['DOTS', dec(d, 1)], ['Wilks', dec(w, 1)], ['Total / peso corporal', dec(tot / bw, 2) + ' ×']].forEach(function(r){
      var tr = document.createElement('tr');
      r.forEach(function(v){ var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      tb.appendChild(tr);
    });
    tabla.hidden = false;
    var ref = d < 250 ? 'Estás construyendo la base: aquí se sube rápido.'
      : d < 325 ? 'Buen nivel de gimnasio: ya se nota que entrenas en serio.'
      : d < 400 ? 'Muy fuerte para alguien que no compite.'
      : d < 475 ? 'Nivel de competición regional o nacional.'
      : 'Nivel de campeonatos. Poquísima gente llega aquí.';
    txt.innerHTML = '<strong>' + ref + '</strong> DOTS es la fórmula que usa hoy la mayoría de federaciones; Wilks es la clásica. Sirven para comparar a gente de distinto peso: a igual total, quien pesa menos puntúa más.';
    ultPts = { d: d, w: w, tot: tot, bw: bw };
  }
  reg(calcPuntos, ['dtSexo', 'dtPeso', 'dtTotal']);
  on('dtShare', 'click', function(){
    if(!ultPts) return;
    tarjeta({ titulo: 'Mis puntos de fuerza', grande: dec(ultPts.d, 1) + ' DOTS', sub: 'Total ' + kg(ultPts.tot) + ' pesando ' + kg(ultPts.bw),
      lineas: ['Wilks: ' + dec(ultPts.w, 1), 'Total / peso: ' + dec(ultPts.tot / ultPts.bw, 2) + ' ×'], archivo: 'mis-puntos-arnoldwork.png' });
  });

  /* ---------- ¿cuánto músculo puedo ganar? ---------- */
  // Medias de Lyle McDonald para hombres (kg de músculo por año); en mujeres, la mitad.
  var MUS_ANO = [[9, 11], [4.5, 5.5], [2.25, 2.75], [1, 1.5], [0.5, 1]];
  var ultMus = null;
  function calcMusculo(){
    var sx = $('muSexo').value, h = num('muAltura'), a = parseInt($('muAnos').value, 10);
    var out = $('muOut'), sub = $('muSub'), tabla = $('muTabla'), txt = $('muTxt');
    tabla.hidden = true; txt.textContent = ''; ultMus = null;
    if(!(h > 0)){ out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Mete tu altura'; return; }
    var f = sx === 'm' ? 0.5 : 1;
    var rango = function(i){ var r = MUS_ANO[Math.min(i, MUS_ANO.length - 1)]; return [r[0] * f, r[1] * f]; };
    var fmt = function(r){ return dec(r[0], 1).replace(',0', '') + ' a ' + dec(r[1], 1).replace(',0', '') + ' kg'; };
    var este = rango(a);
    out.textContent = fmt(este); out.appendChild(sub);
    sub.textContent = 'de músculo en los próximos 12 meses · unos ' + dec(este[0] / 12, 2).replace(/0$/, '') + ' a ' + dec(este[1] / 12, 2).replace(/0$/, '') + ' kg al mes';
    var tb = tabla.querySelector('tbody'); tb.innerHTML = '';
    var acu = [0, 0];
    for(var i = 0; i < 5; i++){
      var r = rango(a + i); acu = [acu[0] + r[0], acu[1] + r[1]];
      var tr = document.createElement('tr');
      [(i === 0 ? 'Este año' : 'Dentro de ' + i + (i === 1 ? ' año' : ' años')), fmt(r), fmt(acu)].forEach(function(v){
        var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
    tabla.hidden = false;
    var hm = h / 100, ffmiMax = sx === 'm' ? 20 : 24, grasa = sx === 'm' ? 0.18 : 0.10;
    var magra = ffmiMax * hm * hm, total = magra / (1 - grasa);
    txt.innerHTML = 'El techo a largo plazo para tu altura ronda los <strong>' + Math.round(magra) + ' kg de masa magra</strong>: con un ' +
      Math.round(grasa * 100) + ' % de grasa pesarías unos <strong>' + Math.round(total) + ' kg</strong> y se te vería muy musculad' + (sx === 'm' ? 'a' : 'o') +
      '. Llegar ahí lleva muchos años y la mayoría de la gente se queda por debajo. Si la báscula sube mucho más rápido que esto, lo que sobra es grasa, no músculo.';
    ultMus = { r: este, sx: sx };
  }
  reg(calcMusculo, ['muSexo', 'muAltura', 'muAnos']);
  on('muShare', 'click', function(){
    if(!ultMus) return;
    tarjeta({ titulo: 'Músculo que puedo ganar este año', grande: dec(ultMus.r[0], 1).replace(',0', '') + '-' + dec(ultMus.r[1], 1).replace(',0', '') + ' kg',
      sub: 'Sin ayudas, entrenando y comiendo bien', lineas: ['Lo demás es grasa o promesas.'], archivo: 'mi-musculo-arnoldwork.png' });
  });

  /* ---------- generador de rutina ---------- */
  var EJ = {
    sq:  { gym: 'Sentadilla con barra', casa: 'Sentadilla goblet con mancuerna', t: 'b' },
    rdl: { gym: 'Peso muerto rumano con barra', casa: 'Peso muerto rumano con mancuernas', t: 'b' },
    bp:  { gym: 'Press banca con barra', casa: 'Press banca con mancuernas', t: 'b' },
    inc: { gym: 'Press inclinado con mancuernas', casa: 'Press inclinado con mancuernas', t: 'b' },
    ohp: { gym: 'Press militar con barra', casa: 'Press militar con mancuernas, sentado', t: 'b' },
    row: { gym: 'Remo con barra', casa: 'Remo con mancuerna a una mano', t: 'b' },
    lat: { gym: 'Jalón al pecho', casa: 'Dominadas (o pullover con mancuerna si no tienes barra)', t: 'b' },
    cab: { gym: 'Remo en polea baja', casa: 'Remo con dos mancuernas en banco inclinado', t: 'a' },
    leg: { gym: 'Prensa de piernas', casa: 'Sentadilla búlgara con mancuernas', t: 'u' },
    lun: { gym: 'Zancadas con mancuernas', casa: 'Zancadas con mancuernas', t: 'u' },
    ht:  { gym: 'Hip thrust con barra', casa: 'Hip thrust con mancuerna apoyado en el banco', t: 'b' },
    lc:  { gym: 'Curl femoral en máquina', casa: 'Puente de isquios con los talones en el banco', t: 'a' },
    lr:  { gym: 'Elevaciones laterales con mancuernas', casa: 'Elevaciones laterales con mancuernas', t: 'a' },
    bi:  { gym: 'Curl de bíceps con barra', casa: 'Curl de bíceps con mancuernas', t: 'a' },
    tri: { gym: 'Extensión de tríceps en polea', casa: 'Press francés con mancuernas', t: 'a' },
    calf:{ gym: 'Elevación de gemelos de pie', casa: 'Gemelos a una pierna con mancuerna', t: 'a' },
    core:{ gym: 'Plancha abdominal', casa: 'Plancha abdominal', t: 'c' }
  };
  var DIAS = {
    fa: ['Cuerpo completo A', ['sq', 'bp', 'row', 'lr', 'lc', 'core']],
    fb: ['Cuerpo completo B', ['rdl', 'ohp', 'lat', 'lun', 'bi', 'tri']],
    ta: ['Torso A', ['bp', 'row', 'ohp', 'lat', 'bi', 'tri']],
    pa: ['Pierna A', ['sq', 'rdl', 'leg', 'lc', 'calf', 'core']],
    tb: ['Torso B', ['inc', 'lat', 'cab', 'lr', 'bi', 'tri']],
    pb: ['Pierna B', ['rdl', 'lun', 'ht', 'lc', 'calf', 'core']],
    em: ['Empuje', ['bp', 'ohp', 'inc', 'lr', 'tri']],
    ti: ['Tirón', ['rdl', 'lat', 'row', 'cab', 'bi']],
    pi: ['Pierna', ['sq', 'leg', 'lc', 'ht', 'calf', 'core']]
  };
  var SEMANA = {
    2: [['fa', 'fb'], 'Cuerpo completo dos veces: lunes y jueves, por ejemplo. Deja al menos dos días entre sesiones.'],
    3: [['fa', 'fb', 'fa'], 'Cuerpo completo en días alternos (lunes, miércoles y viernes). Una semana haces A-B-A y la siguiente B-A-B.'],
    4: [['ta', 'pa', 'tb', 'pb'], 'Torso y pierna, dos veces cada uno: por ejemplo lunes, martes, jueves y viernes.'],
    5: [['ta', 'pa', 'em', 'ti', 'pb'], 'Torso y pierna al principio de la semana, y empuje, tirón y pierna al final.'],
    6: [['em', 'ti', 'pi', 'em', 'ti', 'pi'], 'Empuje, tirón y pierna, dos vueltas por semana, con un día de descanso.']
  };
  var ultRut = '';
  function seriesDe(k, i, avanz, nom){
    var t = EJ[k].t;
    if(t === 'c') return '3 × 30-45 s';
    var s = avanz && i < 2 ? 4 : 3;
    if(t === 'b') return s + ' × ' + (i < 2 ? '6-10' : '8-12');
    if(t === 'u') return s + ' × 8-12' + (/zancada|búlgara/i.test(nom) ? ' por pierna' : '');
    return s + ' × 10-15';
  }
  function calcRutina(){
    var d = parseInt($('ruDias').value, 10), donde = $('ruDonde').value, avanz = $('ruNivel').value === '1';
    var sem = SEMANA[d], plan = $('ruPlan'), warn = $('ruWarn');
    plan.innerHTML = ''; warn.hidden = true;
    var out = $('ruOut'), sub = $('ruSub');
    out.textContent = d + ' días'; out.appendChild(sub);
    sub.textContent = { 2: 'Cuerpo completo', 3: 'Cuerpo completo', 4: 'Torso y pierna', 5: 'Torso, pierna, empuje y tirón', 6: 'Empuje, tirón y pierna' }[d] +
      ' · ' + (donde === 'gym' ? 'en el gimnasio' : 'en casa');
    if(!avanz && d >= 5){ warn.hidden = false; warn.textContent = 'Si empiezas, con 3 días a la semana progresas igual y te recuperas mejor. Usa 5 o 6 solo si te sobra tiempo y duermes bien.'; }
    var texto = ['Rutina de ' + d + ' días · ArnoldWork', ''];
    var vistos = {};
    sem[0].forEach(function(k, n){
      var dia = DIAS[k], box = document.createElement('div'); box.className = 'dia';
      var rep = vistos[k] ? ' (repite)' : ''; vistos[k] = true;
      var h = document.createElement('p'); h.className = 'dia-h'; h.textContent = 'Día ' + (n + 1) + ' · ' + dia[0] + rep; box.appendChild(h);
      var ul = document.createElement('ul');
      texto.push('Día ' + (n + 1) + ' · ' + dia[0]);
      dia[1].forEach(function(e, i){
        var li = document.createElement('li'), nom = EJ[e][donde], sr = seriesDe(e, i, avanz, nom);
        var b = document.createElement('span'); b.textContent = nom;
        var s = document.createElement('b'); s.textContent = sr;
        li.appendChild(b); li.appendChild(s); ul.appendChild(li);
        texto.push('  ' + nom + ': ' + sr);
      });
      box.appendChild(ul); plan.appendChild(box); texto.push('');
    });
    var rir = avanz ? 'Acaba cada serie dejando <strong>1 o 2 repeticiones en la recámara</strong>; en los ejercicios pequeños puedes llegar al fallo.'
                    : 'Acaba cada serie dejando <strong>2 o 3 repeticiones en la recámara</strong>: suficiente para crecer y aprender la técnica sin lesionarte.';
    $('ruTxt').innerHTML = sem[1] + ' ' + rir + ' Cuando llegues al máximo de repeticiones en todas las series, sube el peso (<a href="/herramientas/cuando-subir-peso/">¿Subo peso?</a>). Descansa 2-3 minutos en los básicos y 1-2 en el resto, y calienta antes con <a href="/herramientas/series-de-aproximacion/">series de aproximación</a>.';
    texto.push('Deja ' + (avanz ? '1-2' : '2-3') + ' repeticiones en la recámara. Sube el peso cuando llegues al máximo del rango.', 'arnoldwork.com/herramientas/generador-de-rutina/');
    ultRut = texto.join('\n');
  }
  reg(calcRutina, ['ruDias', 'ruDonde', 'ruNivel']);
  on('ruCopy', 'click', function(){
    var b = $('ruCopy');
    var hecho = function(){ b.textContent = 'Copiada ✓'; setTimeout(function(){ b.textContent = 'Copiar la rutina'; }, 2000); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ultRut).then(hecho, function(){ window.prompt('Copia la rutina:', ultRut); });
    else window.prompt('Copia la rutina:', ultRut);
  });

  /* ---------- cuaderno de entreno ---------- */
  var BASE_EJ = ['Press banca', 'Sentadilla', 'Peso muerto', 'Press militar', 'Dominadas', 'Remo con barra', 'Jalón al pecho',
    'Press inclinado con mancuernas', 'Hip thrust', 'Prensa de piernas', 'Peso muerto rumano', 'Curl de bíceps', 'Fondos'];
  var cuad = (function(){ try{ var a = JSON.parse(sget('cuaderno') || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } })();
  var fechaTxt = function(s){ var p = partes(s); return p[2] + '/' + (p[1] + 1) + '/' + String(p[0]).slice(2); };
  var normal = function(s){ return s.trim().replace(/\s+/g, ' '); };
  var clave = function(s){ return normal(s).toLowerCase(); };
  function ejercicios(){
    var vistos = {}, lista = [];
    cuad.slice().reverse().forEach(function(x){ var k = clave(x.e); if(!vistos[k]){ vistos[k] = 1; lista.push(x.e); } });
    return lista;
  }
  function guardaCuad(){ sset('cuaderno', JSON.stringify(cuad)); }
  function pintaGraf(regs){
    var c = $('cuGraf'), x = c.getContext('2d');
    var dias = {}, orden = [];
    regs.forEach(function(r){ var v = est(r.w, Math.min(r.r, 12)); if(!(r.d in dias)){ dias[r.d] = v; orden.push(r.d); } else dias[r.d] = Math.max(dias[r.d], v); });
    orden.sort();
    c.hidden = orden.length < 2;
    if(orden.length < 2) return;
    var W = c.width, H = c.height, pad = 48;
    var vals = orden.map(function(d){ return dias[d]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if(hi - lo < 1){ hi += 1; lo -= 1; }
    var t0 = dias0(orden[0]), t1 = dias0(orden[orden.length - 1]) || 1;
    var px = function(d){ return pad + (dias0(d) - t0) / Math.max(1, t1 - t0) * (W - pad * 2); };
    var py = function(v){ return H - pad - (v - lo) / (hi - lo) * (H - pad * 2); };
    x.clearRect(0, 0, W, H);
    x.strokeStyle = 'rgba(244,242,239,0.12)'; x.lineWidth = 1;
    [lo, (lo + hi) / 2, hi].forEach(function(v){ x.beginPath(); x.moveTo(pad, py(v)); x.lineTo(W - pad, py(v)); x.stroke(); });
    x.fillStyle = '#A9A9A9'; x.font = '600 30px Archivo, sans-serif';
    x.fillText(kg(r05(hi)), pad, py(hi) - 12); x.fillText(kg(r05(lo)), pad, py(lo) + 36);
    x.strokeStyle = '#DE3A3A'; x.lineWidth = 6; x.beginPath();
    orden.forEach(function(d, i){ var X = px(d), Y = py(dias[d]); if(i) x.lineTo(X, Y); else x.moveTo(X, Y); });
    x.stroke();
    x.fillStyle = '#F4F2EF';
    orden.forEach(function(d){ x.beginPath(); x.arc(px(d), py(dias[d]), 8, 0, Math.PI * 2); x.fill(); });
  }
  function dias0(s){ var p = partes(s); return Date.UTC(p[0], p[1], p[2]) / 864e5; }
  function pintaCuad(){
    var lista = ejercicios(), ver = $('cuVer'), dl = $('cuLista');
    var sel = ver.value || sget('cuVer') || lista[0] || '';
    ver.innerHTML = ''; dl.innerHTML = '';
    lista.concat(BASE_EJ.filter(function(b){ return lista.map(clave).indexOf(clave(b)) < 0; })).forEach(function(e){
      var o = document.createElement('option'); o.value = e; dl.appendChild(o);
    });
    if(!lista.length){
      var o0 = document.createElement('option'); o0.textContent = 'Sin ejercicios todavía'; o0.value = ''; ver.appendChild(o0);
    }
    lista.forEach(function(e){ var o = document.createElement('option'); o.value = e; o.textContent = e; ver.appendChild(o); });
    if(lista.map(clave).indexOf(clave(sel)) >= 0) ver.value = lista.filter(function(e){ return clave(e) === clave(sel); })[0];
    var out = $('cuOut'), sub = $('cuSub'), tabla = $('cuTabla'), tb = tabla.querySelector('tbody');
    var regs = cuad.filter(function(x){ return clave(x.e) === clave(ver.value); });
    tb.innerHTML = '';
    if(!regs.length){
      out.textContent = '—'; out.appendChild(sub); sub.textContent = 'Todavía no has apuntado nada'; tabla.hidden = true; $('cuGraf').hidden = true; return;
    }
    var ordenados = regs.slice().sort(function(a, b){ return a.d < b.d ? 1 : a.d > b.d ? -1 : b.id - a.id; });
    var mejor = regs.reduce(function(m, x){ return est(x.w, Math.min(x.r, 12)) > est(m.w, Math.min(m.r, 12)) ? x : m; });
    var primero = regs.slice().sort(function(a, b){ return a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id; })[0];
    var eM = est(mejor.w, Math.min(mejor.r, 12)), eP = est(primero.w, Math.min(primero.r, 12));
    out.textContent = kg(r05(eM)); out.appendChild(sub);
    var sube = eP > 0 ? Math.round((eM / eP - 1) * 100) : 0;
    sub.textContent = 'Tu mejor marca: ' + kg(mejor.w) + ' × ' + mejor.r + ' (1RM estimado)' + (sube > 0 ? ' · +' + sube + ' % desde el ' + fechaTxt(primero.d) : '');
    ordenados.slice(0, 40).forEach(function(x){
      var tr = document.createElement('tr');
      [fechaTxt(x.d), kg(x.w) + ' × ' + x.r + (x.s > 1 ? ' · ' + x.s + ' series' : ''), kg(r05(est(x.w, Math.min(x.r, 12))))].forEach(function(v){
        var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
      });
      var td = document.createElement('td'), b = document.createElement('button');
      b.type = 'button'; b.className = 'linkbtn'; b.textContent = 'Borrar'; b.setAttribute('aria-label', 'Borrar la serie del ' + fechaTxt(x.d));
      b.addEventListener('click', function(){
        if(!window.confirm('¿Borrar esta serie?')) return;
        cuad = cuad.filter(function(y){ return y.id !== x.id; }); guardaCuad(); pintaCuad();
      });
      td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
    });
    tabla.hidden = false;
    pintaGraf(regs);
  }
  if($('cuaderno')){
    $('cuFecha').value = hoyISO();
    on('cuVer', 'change', function(){ sset('cuVer', $('cuVer').value); pintaCuad(); });
    on('cuAdd', 'click', function(){
      var e = normal($('cuEj').value), w = num('cuPeso'), r = ent('cuReps'), s = ent('cuSeries') || 1, d = $('cuFecha').value || hoyISO();
      var warn = $('cuWarn'); warn.hidden = true;
      if(!e || !(w >= 0) || isNaN(w) || !(r >= 1)){ warn.hidden = false; warn.textContent = 'Escribe el ejercicio, el peso y las repeticiones.'; return; }
      var igual = ejercicios().filter(function(x){ return clave(x) === clave(e); })[0];
      cuad.push({ id: Date.now(), e: igual || e, d: d, w: w, r: r, s: Math.max(1, Math.min(20, s)) });
      if(cuad.length > 3000) cuad = cuad.slice(-3000);
      guardaCuad();
      $('cuVer').value = igual || e; sset('cuVer', igual || e);
      $('cuReps').value = '';
      pintaCuad();
      var b = $('cuAdd'); b.textContent = 'Apuntado ✓'; setTimeout(function(){ b.textContent = 'Apuntar'; }, 1500);
    });
    on('cuCsv', 'click', function(){
      if(!cuad.length) return;
      var esc = function(v){ v = String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var filas = [['Fecha', 'Ejercicio', 'Peso (kg)', 'Repeticiones', 'Series', '1RM estimado (kg)']].concat(
        cuad.slice().sort(function(a, b){ return a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id; }).map(function(x){
          return [x.d, x.e, String(x.w).replace('.', ','), x.r, x.s, String(r05(est(x.w, Math.min(x.r, 12)))).replace('.', ',')];
        }));
      descargar(new Blob(['﻿' + filas.map(function(f){ return f.map(esc).join(';'); }).join('\n')], { type: 'text/csv;charset=utf-8' }), 'cuaderno-arnoldwork.csv');
    });
    pintaCuad();
  }

  /* ---------- sustituto de ejercicio ---------- */
  var SUST = [
    ['Press banca', 'Pecho, tríceps y hombro delantero', {
      gym: ['Press banca con mancuernas', 'Press de pecho en máquina', 'Fondos en paralelas inclinándote hacia delante'],
      manc: ['Press banca con mancuernas', 'Press en el suelo con mancuernas si no tienes banco'],
      gomas: ['Press de pecho con goma anclada a la espalda', 'Flexiones con goma por la espalda para añadir resistencia'],
      nada: ['Flexiones (sube los pies a una silla para hacerlas más duras)', 'Flexiones con pausa de 2 segundos abajo'] }],
    ['Press inclinado', 'Parte alta del pecho y hombro delantero', {
      gym: ['Press inclinado en máquina o multipower', 'Press inclinado con barra'],
      manc: ['Press inclinado con mancuernas', 'Press con mancuernas en el suelo con agarre neutro'],
      gomas: ['Press con goma desde abajo, empujando hacia arriba y delante'],
      nada: ['Flexiones con los pies elevados en una silla', 'Flexiones pica (cadera alta)'] }],
    ['Press militar', 'Hombros y tríceps', {
      gym: ['Press de hombro con mancuernas', 'Press de hombro en máquina', 'Press Arnold'],
      manc: ['Press militar con mancuernas sentado', 'Press Arnold'],
      gomas: ['Press de hombro de pie pisando la goma'],
      nada: ['Flexiones pica', 'Flexiones en pino con apoyo en la pared (avanzado)'] }],
    ['Elevaciones laterales', 'Hombro lateral', {
      gym: ['Elevación lateral en polea', 'Elevación lateral en máquina'],
      manc: ['Elevaciones laterales tumbado de lado en el banco inclinado'],
      gomas: ['Elevaciones laterales pisando la goma'],
      nada: ['Elevaciones laterales con botellas o garrafas de agua'] }],
    ['Dominadas', 'Dorsal y bíceps', {
      gym: ['Jalón al pecho', 'Dominadas asistidas en máquina o con goma'],
      manc: ['Pullover con mancuerna', 'Remo con mancuerna a una mano'],
      gomas: ['Jalón con goma anclada arriba (en una puerta)'],
      nada: ['Remo invertido bajo una mesa firme', 'Dominadas negativas: sube saltando y baja en 5 segundos'] }],
    ['Jalón al pecho', 'Dorsal y bíceps', {
      gym: ['Dominadas o dominadas asistidas', 'Jalón a una mano en polea'],
      manc: ['Pullover con mancuerna', 'Remo con mancuerna a una mano'],
      gomas: ['Jalón con goma anclada arriba'],
      nada: ['Remo invertido bajo una mesa firme', 'Dominadas negativas'] }],
    ['Remo con barra', 'Espalda media, dorsal y bíceps', {
      gym: ['Remo en polea baja', 'Remo en máquina con apoyo en el pecho', 'Remo con mancuerna a una mano'],
      manc: ['Remo con mancuerna a una mano', 'Remo con dos mancuernas en banco inclinado'],
      gomas: ['Remo sentado con goma alrededor de los pies'],
      nada: ['Remo invertido bajo una mesa firme', 'Remo con una mochila cargada'] }],
    ['Sentadilla', 'Cuádriceps y glúteo', {
      gym: ['Sentadilla en multipower', 'Prensa de piernas', 'Sentadilla hack'],
      manc: ['Sentadilla goblet', 'Sentadilla búlgara con mancuernas'],
      gomas: ['Sentadilla pisando la goma con los extremos en los hombros'],
      nada: ['Sentadilla búlgara con el pie de atrás en una silla', 'Sentadilla con pausa de 3 segundos abajo'] }],
    ['Prensa de piernas', 'Cuádriceps y glúteo', {
      gym: ['Sentadilla hack', 'Sentadilla con barra', 'Sentadilla búlgara'],
      manc: ['Sentadilla búlgara con mancuernas', 'Sentadilla goblet'],
      gomas: ['Sentadilla con goma'],
      nada: ['Sentadilla búlgara', 'Step-up a una silla firme'] }],
    ['Peso muerto', 'Glúteo, isquios y toda la espalda', {
      gym: ['Peso muerto con barra hexagonal', 'Peso muerto rumano con barra', 'Rack pull (desde las rodillas)'],
      manc: ['Peso muerto rumano con mancuernas', 'Peso muerto a una pierna con mancuerna'],
      gomas: ['Peso muerto pisando la goma', 'Pull-through con goma anclada abajo'],
      nada: ['Peso muerto a una pierna', 'Puente de glúteo a una pierna'] }],
    ['Peso muerto rumano', 'Isquios y glúteo', {
      gym: ['Curl femoral en máquina', 'Hiperextensiones', 'Buenos días con barra'],
      manc: ['Peso muerto rumano con mancuernas', 'Peso muerto a una pierna con mancuerna'],
      gomas: ['Pull-through con goma', 'Peso muerto rumano pisando la goma'],
      nada: ['Peso muerto a una pierna', 'Curl nórdico asistido (pies sujetos bajo un sofá)'] }],
    ['Hip thrust', 'Glúteo', {
      gym: ['Hip thrust en máquina', 'Puente de glúteo con barra en el suelo', 'Patada de glúteo en polea'],
      manc: ['Hip thrust con mancuerna apoyado en el banco', 'Hip thrust a una pierna'],
      gomas: ['Hip thrust con goma sobre la cadera'],
      nada: ['Hip thrust a una pierna con la espalda en el sofá', 'Puente de glúteo con pausa arriba'] }],
    ['Zancadas', 'Cuádriceps y glúteo, una pierna cada vez', {
      gym: ['Sentadilla búlgara', 'Step-up al cajón', 'Prensa a una pierna'],
      manc: ['Sentadilla búlgara con mancuernas', 'Step-up al banco con mancuernas'],
      gomas: ['Zancada atrás pisando la goma'],
      nada: ['Sentadilla búlgara', 'Zancadas caminando'] }],
    ['Curl femoral', 'Isquios', {
      gym: ['Peso muerto rumano', 'Curl femoral sentado o tumbado (la otra máquina)', 'Curl nórdico'],
      manc: ['Curl femoral tumbado con mancuerna entre los pies', 'Puente de isquios con los talones en el banco'],
      gomas: ['Curl femoral tumbado con goma anclada'],
      nada: ['Curl nórdico asistido', 'Curl femoral deslizando los talones con una toalla en el suelo'] }],
    ['Extensión de cuádriceps', 'Cuádriceps', {
      gym: ['Sentadilla hack', 'Prensa con los pies bajos', 'Sentadilla sissy'],
      manc: ['Sentadilla goblet con talones elevados', 'Sentadilla búlgara'],
      gomas: ['Extensión de rodilla sentado con goma anclada'],
      nada: ['Sentadilla sissy agarrado a una puerta', 'Sentadilla con talones elevados'] }],
    ['Curl de bíceps', 'Bíceps', {
      gym: ['Curl en polea', 'Curl con mancuernas', 'Curl en banco Scott'],
      manc: ['Curl con mancuernas', 'Curl martillo', 'Curl inclinado en el banco'],
      gomas: ['Curl pisando la goma'],
      nada: ['Remo invertido con agarre supino (palmas hacia ti)', 'Curl con una mochila cargada'] }],
    ['Extensión de tríceps en polea', 'Tríceps', {
      gym: ['Press francés con barra Z', 'Fondos en banco', 'Extensión por encima de la cabeza en polea'],
      manc: ['Press francés con mancuernas', 'Extensión por encima de la cabeza con una mancuerna'],
      gomas: ['Extensión de tríceps con goma anclada arriba'],
      nada: ['Fondos entre dos sillas', 'Flexiones con las manos juntas'] }],
    ['Fondos', 'Pecho bajo y tríceps', {
      gym: ['Fondos asistidos en máquina', 'Press banca con agarre cerrado', 'Press declinado'],
      manc: ['Press banca con mancuernas y agarre neutro', 'Press francés con mancuernas'],
      gomas: ['Press de pecho con goma hacia abajo'],
      nada: ['Fondos entre dos sillas', 'Flexiones con las manos juntas'] }],
    ['Elevación de gemelos', 'Gemelos', {
      gym: ['Gemelos en prensa', 'Gemelos sentado en máquina'],
      manc: ['Gemelos a una pierna con mancuerna en un escalón'],
      gomas: ['Gemelos en el suelo empujando la goma con la punta del pie'],
      nada: ['Gemelos a una pierna en un escalón, con pausa arriba'] }]
  ];
  if($('sustituto')){
    SUST.forEach(function(s, i){ var o = document.createElement('option'); o.value = String(i); o.textContent = s[0]; $('suEj').appendChild(o); });
    var vs = sget('f.suEj'); if(vs !== null && SUST[+vs]) $('suEj').value = vs;
  }
  function calcSust(){
    var s = SUST[+$('suEj').value] || SUST[0], m = $('suMat').value, ul = $('suList');
    $('suMus').innerHTML = 'Trabaja: <strong>' + s[1] + '</strong>';
    ul.innerHTML = '';
    s[2][m].forEach(function(a){ var li = document.createElement('li'); li.textContent = a; ul.appendChild(li); });
  }
  reg(calcSust, ['suEj', 'suMat']);

  /* ---------- borrar datos ---------- */
  on('clearAll', 'click', function(){
    if(!window.confirm('¿Borrar todo lo que esta página ha guardado en tu móvil?')) return;
    if(LS){
      try{
        var ks = []; for(var i = 0; i < LS.length; i++){ var k = LS.key(i); if(k && k.indexOf('aw.') === 0) ks.push(k); }
        ks.forEach(function(k){ LS.removeItem(k); });
      }catch(e){}
    }
    location.reload();
  });

  $('yr').textContent = new Date().getFullYear();
  recalc();
  if($('vList')) pintaVol();
  if($('tOut')) pinta();
})();
