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
