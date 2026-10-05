#!/usr/bin/env python3
"""Genera las páginas de TurnoWork para buscadores: una por tipo de turno, con el ciclo ya calculado.

  python3 turnos/seo.py   →  turnos/web/cuadrante/<slug>/index.html, turnos/web/cuadrante/index.html y turnos/web/sitemap.xml

Cada página enseña el ciclo de 2027 (los primeros meses y los totales del año) y un botón
«Usar este ciclo» que abre la app con ?ciclo=<slug> (la app lo carga sola).
"""
import datetime as dt, html, os

ANIO = 2027
WEB = os.path.join(os.path.dirname(__file__), "web")
BASE = "https://turnos.arnoldwork.com"
TURNOS = {"M": ("Mañana", 7, 8), "T": ("Tarde", 15, 8), "N": ("Noche", 23, 8), "D": ("Día de 12 h", 8, 12), "G": ("Guardia de 24 h", 8, 24)}
COLOR = {"M": "#bfe3ff", "T": "#b7ead3", "N": "#c3c8ff", "D": "#a6e4e6", "G": "#9fd6b6", "L": "#ffffff"}

# slug, patrón, cambios de horario, título, h1, para quién, texto
PAGINAS = [
    ("enfermeria-12-horas", "D N L L", {"N": ("Noche de 12 h", 20, 12)}, "Cuadrante de enfermería de 12 horas 2027",
     "Cuadrante de enfermería de 12 horas: día, noche y dos libres", "Enfermería, TCAE, celadores y técnicos sanitarios",
     "El ciclo de 12 horas más habitual en hospitales y urgencias: un día de 8:00 a 20:00, una noche de 20:00 a 8:00 y dos días libres. Se repite cada cuatro días, así que tus libres van cambiando de día de la semana."),
    ("4x4-12-horas", "D D D D L L L L", {}, "Cuadrante 4×4 de 12 horas 2027",
     "Cuadrante 4×4: cuatro días de 12 horas y cuatro libres", "Seguridad, industria, emergencias y sanidad",
     "Cuatro jornadas seguidas de 12 horas y cuatro días de descanso. Trabajas la mitad de los días del año, con bloques largos de libranza."),
    ("bomberos-24x72", "G L L L", {}, "Cuadrante de bomberos 24×72 2027",
     "Cuadrante de bomberos 24×72: una guardia de 24 horas y tres libres", "Bomberos, emergencias y protección civil",
     "Una guardia de 24 horas, normalmente de 8:00 a 8:00, y tres días de descanso. Es el ciclo de guardias más extendido en los parques de bomberos."),
    ("guardia-24-horas-4-libres", "G L L L L", {}, "Cuadrante de guardias de 24 horas y 4 libres 2027",
     "Cuadrante de guardias de 24 horas con cuatro libres", "Bomberos, salvamento y servicios de guardia",
     "Una guardia de 24 horas seguida de cuatro días libres. Menos guardias al año que el 24×72, con descansos más largos."),
    ("policia-rotativo-2-2-2", "M M T T N N L L L L", {}, "Cuadrante de policía 2-2-2 con 4 libres 2027",
     "Cuadrante de policía rotativo: 2 mañanas, 2 tardes, 2 noches y 4 libres", "Policía Local, Policía Nacional, Guardia Civil y vigilantes",
     "Dos mañanas, dos tardes, dos noches y cuatro días libres: un ciclo de diez días que reparte por igual los tres turnos y deja descansos de cuatro días."),
    ("vigilante-seguridad-2-2-2", "M M T T N N L L L L", {}, "Cuadrante de vigilante de seguridad 2027",
     "Cuadrante de vigilante de seguridad: mañanas, tardes y noches", "Vigilantes de seguridad y personal de control de accesos",
     "El rotativo clásico de seguridad privada: dos mañanas, dos tardes, dos noches y cuatro libres. Calcula tus noches, tus fines de semana y tus horas del año."),
    ("rotativo-semanal-fabrica", "M M M M M L L T T T T T L L N N N N N L L", {}, "Cuadrante rotativo semanal de fábrica 2027",
     "Cuadrante rotativo semanal: una semana de mañanas, otra de tardes y otra de noches", "Fábricas, logística, almacenes y producción a tres turnos",
     "Cinco mañanas, cinco tardes y cinco noches, cada bloque con su fin de semana libre. El turno típico de las fábricas a tres turnos."),
    ("hosteleria-2-2-4", "M M T T L L L L", {}, "Cuadrante de hostelería 2-2 con 4 libres 2027",
     "Cuadrante de hostelería: 2 mañanas, 2 tardes y 4 libres", "Hostelería, hoteles, comercio y atención al público",
     "Dos mañanas, dos tardes y cuatro días libres, sin noches. Un ciclo de ocho días muy usado en hoteles y servicios con horario amplio."),
    ("6x6", "M M M T T T L L L L L L", {}, "Cuadrante 6×6 2027",
     "Cuadrante 6×6: seis días de trabajo y seis de descanso", "Industria, plataformas, minería y servicios continuos",
     "Tres mañanas, tres tardes y seis días libres seguidos. Trabajas medio año en bloques cortos y descansas casi una semana entera cada vez."),
]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
e = html.escape


def ciclo_anio(patron, turnos):
    c = patron.split()
    dias, r = [], dict(trab=0, horas=0, noches=0, findes=0, libres=0)
    d = dt.date(ANIO, 1, 1)
    while d.year == ANIO:
        t = c[(d - dt.date(ANIO, 1, 1)).days % len(c)]
        dias.append((d, t))
        if t in turnos:
            n, ini, h = turnos[t]
            r["trab"] += 1; r["horas"] += h
            if t == "N" or ini >= 20: r["noches"] += 1
            if d.weekday() >= 5: r["findes"] += 1
        else:
            r["libres"] += 1
        d += dt.timedelta(days=1)
    return dias, r


def mes_html(dias, m):
    ds = [x for x in dias if x[0].month == m]
    hueco = ds[0][0].weekday()
    celdas = "".join("<span></span>" for _ in range(hueco))
    for d, t in ds:
        fin = " finde" if d.weekday() >= 5 else ""
        celdas += f'<span class="d{fin}" style="background:{COLOR.get(t, "#fff")}"><small>{d.day}</small>{t}</span>'
    return f'<div class="mes"><h3>{MESES[m - 1]}</h3><div class="sem"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="dias">{celdas}</div></div>'


CSS = """:root{--fondo:#faf8ff;--panel:#fff;--tinta:#1d1838;--suave:#6b6688;--linea:#ebe7f5;--acento:#6c4cf1;--acento-2:#c026d3;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--fondo:#110e22;--panel:#1b1733;--tinta:#efecff;--suave:#a7a1c8;--linea:#2c2650;--acento:#9d86ff;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.6 "Manrope",system-ui,sans-serif}
a{color:var(--acento)}.env{max-width:960px;margin:0 auto;padding-inline:16px}
header{background:linear-gradient(120deg,#4338ca,#7c3aed 55%,#c026d3);color:#fff}header .env{padding-block:22px 30px}
.marca{font:800 1.05rem/1 "Unbounded",system-ui,sans-serif;color:#fff;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
h1{font:600 clamp(1.5rem,5vw,2.2rem)/1.15 "Unbounded",system-ui,sans-serif;margin:.6em 0 .3em;text-wrap:balance}
header p{margin:0;max-width:60ch;color:rgba(255,255,255,.92)}
.cta{display:inline-block;margin-top:16px;background:#fff;color:#4338ca;font-weight:800;padding:12px 18px;border-radius:12px;text-decoration:none}
main{padding-block:20px 40px}h2{font:600 1.2rem/1.3 "Unbounded",system-ui,sans-serif;margin:28px 0 10px}
.res{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.res div{background:var(--panel);border:1px solid var(--linea);border-radius:14px;padding:10px 12px}.res small{display:block;color:var(--suave);font-weight:700;font-size:.75rem;text-transform:uppercase}.res b{font-size:1.2rem}
.meses{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.mes{background:var(--panel);border:1px solid var(--linea);border-radius:16px;padding:10px}.mes h3{margin:0 0 6px;font-size:.95rem;text-transform:capitalize}
.sem,.dias{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.sem span{font-size:.65rem;color:var(--suave);text-align:center;font-weight:700}
.d{position:relative;aspect-ratio:1;display:grid;place-items:center;border-radius:7px;font-weight:800;font-size:.75rem;color:#1d1838;border:1px solid var(--linea)}
.d small{position:absolute;top:1px;left:3px;font-size:.5rem;font-weight:600;opacity:.7}.d.finde small{opacity:1;font-weight:900}
.otros{display:grid;gap:8px;padding:0;list-style:none}.otros a{display:block;background:var(--panel);border:1px solid var(--linea);border-radius:12px;padding:10px 14px;text-decoration:none;color:var(--tinta);font-weight:700}
footer{border-top:1px solid var(--linea);padding-block:20px 40px;color:var(--suave);font-size:.85rem}"""

FUENTES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Manrope:wght@400;700;800&display=swap">'


def hora(v):
    v %= 24; return f"{int(v):02d}:{round((v % 1) * 60):02d}"


def pagina(slug, patron, cambios, titulo, h1, quien, texto):
    turnos = dict(TURNOS); turnos.update(cambios)
    dias, r = ciclo_anio(patron, turnos)
    usados = sorted(set(t for t in patron.split() if t in turnos), key="MTNDG".index)
    leyenda = " · ".join(f"<b>{t}</b> {e(turnos[t][0])} ({hora(turnos[t][1])}–{hora(turnos[t][1] + turnos[t][2])})" for t in usados) + " · <b>L</b> Libre"
    otros = "".join(f'<li><a href="/cuadrante/{p[0]}/">{e(p[3])}</a></li>' for p in PAGINAS if p[0] != slug)
    desc = f"{texto} Calcula gratis tu año {ANIO}: días de trabajo, horas, noches y fines de semana."
    url = f"{BASE}/cuadrante/{slug}/"
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)} · TurnoWork</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{url}">
<meta property="og:title" content="{e(titulo)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:type" content="article">
<link rel="icon" href="/icono.svg" type="image/svg+xml">{FUENTES}<style>{CSS}</style>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{{"@type":"Question","name":"¿Cuántos días se trabaja al año con este cuadrante?","acceptedAnswer":{{"@type":"Answer","text":"En {ANIO}, empezando el ciclo el 1 de enero, salen {r['trab']} días de trabajo, {r['horas']} horas y {r['libres']} días libres."}}}},{{"@type":"Question","name":"¿Cómo veo mi cuadrante de {ANIO} con mis fechas?","acceptedAnswer":{{"@type":"Answer","text":"Abre el ciclo en TurnoWork, indica un día que recuerdes y en qué día del ciclo estabas, y te calcula todo el año gratis con los festivos de tu comunidad."}}}}]}}</script>
</head><body>
<header><div class="env"><a class="marca" href="/"><img src="/icono.svg" alt="" width="28" height="28">TurnoWork</a>
<h1>{e(h1)}</h1><p>{e(texto)}</p><p style="margin-top:8px"><b>Para:</b> {e(quien)}.</p>
<a class="cta" href="/?ciclo={slug}">Usar este ciclo con mis fechas →</a></div></header>
<main class="env">
<h2>Tu año {ANIO} con este cuadrante</h2>
<div class="res"><div><small>Días de trabajo</small><b>{r['trab']}</b></div><div><small>Horas</small><b>{format(r['horas'], ',').replace(',', '.')}</b></div><div><small>Noches</small><b>{r['noches']}</b></div><div><small>Días de finde trabajados</small><b>{r['findes']}</b></div><div><small>Días libres</small><b>{r['libres']}</b></div></div>
<p style="color:var(--suave);font-size:.9rem">Calculado empezando el ciclo el 1 de enero de {ANIO} y con horarios típicos. En TurnoWork lo ajustas a tu día de inicio, tus horarios exactos, tu jornada anual y los festivos de tu comunidad.</p>
<h2>Enero, febrero y marzo de {ANIO}</h2>
<p style="font-size:.9rem">{leyenda}</p>
<div class="meses">{mes_html(dias, 1)}{mes_html(dias, 2)}{mes_html(dias, 3)}</div>
<p><a class="cta" style="background:var(--acento);color:#fff" href="/?ciclo={slug}">Ver mi año entero gratis en TurnoWork →</a></p>
<h2>Qué más hace TurnoWork</h2>
<p>Festivos de tu comunidad, saldo de horas frente a tu jornada anual, cambios de turno con compañeros por WhatsApp, notas que se repiten, días libres en común con tu pareja y tus turnos en el calendario del móvil. Gratis, sin registro y funciona sin conexión.</p>
<h2>Otros cuadrantes</h2><ul class="otros">{otros}</ul>
</main>
<footer><div class="env">TurnoWork, un proyecto de <a href="https://arnoldwork.com/">ArnoldWork</a> · <a href="/cuadrante/">Todos los cuadrantes</a> · <a href="/">Abrir la app</a></div></footer>
</body></html>
"""


def indice():
    items = "".join(f'<li><a href="/cuadrante/{p[0]}/">{e(p[3])}<br><span style="font-weight:500;color:var(--suave);font-size:.9rem">{e(p[5])}</span></a></li>' for p in PAGINAS)
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cuadrantes de turnos {ANIO} · TurnoWork</title><meta name="description" content="Cuadrantes de turnos {ANIO} para enfermería, policía, bomberos, seguridad, fábricas y hostelería: 12 horas, 4×4, 24×72, 2-2-2, 6×6… Calcula tu año gratis.">
<link rel="canonical" href="{BASE}/cuadrante/"><link rel="icon" href="/icono.svg" type="image/svg+xml">{FUENTES}<style>{CSS}</style></head><body>
<header><div class="env"><a class="marca" href="/"><img src="/icono.svg" alt="" width="28" height="28">TurnoWork</a>
<h1>Cuadrantes de turnos {ANIO}</h1><p>Elige tu tipo de turno, mira cómo queda tu año y ábrelo en TurnoWork con tus fechas. Gratis y sin registro.</p></div></header>
<main class="env"><ul class="otros">{items}</ul></main>
<footer><div class="env">TurnoWork, un proyecto de <a href="https://arnoldwork.com/">ArnoldWork</a> · <a href="/">Abrir la app</a></div></footer></body></html>
"""


if __name__ == "__main__":
    for p in PAGINAS:
        carpeta = os.path.join(WEB, "cuadrante", p[0]); os.makedirs(carpeta, exist_ok=True)
        open(os.path.join(carpeta, "index.html"), "w").write(pagina(*p))
    os.makedirs(os.path.join(WEB, "cuadrante"), exist_ok=True)
    open(os.path.join(WEB, "cuadrante", "index.html"), "w").write(indice())
    hoy = dt.date.today().isoformat()
    urls = [f"{BASE}/", f"{BASE}/cuadrante/"] + [f"{BASE}/cuadrante/{p[0]}/" for p in PAGINAS]
    open(os.path.join(WEB, "sitemap.xml"), "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{hoy}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    print(f"{len(PAGINAS)} páginas, índice y sitemap")
