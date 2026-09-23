#!/usr/bin/env python3
"""ArnoldWork · genera las páginas de herramientas a partir de src/.

    python3 build.py          escribe los archivos en web/
    python3 build.py --check  falla si web/ no está al día con src/ (lo usa GitHub antes de publicar)

Qué genera:
  web/herramientas/index.html          todas las herramientas en una página
  web/herramientas/<slug>/index.html   una página por herramienta
  web/herramientas/estilos.css, app.js estilo y código compartidos
  web/sw.js, web/sitemap.xml
No toques esos archivos en web/: edita src/ y vuelve a ejecutar build.py.
"""
import hashlib
import html
import json
import os
import sys
from datetime import date

RAIZ = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(RAIZ, "src")
WEB = os.path.join(RAIZ, "web")
DOMINIO = "https://arnoldwork.com"
AMOR = "Made with love from Mallorca ❤️"   # firma de las tarjetas al compartir

sys.path.insert(0, os.path.join(SRC, "herramientas"))
from catalogo import GRUPOS, HERRAMIENTAS  # noqa: E402

NUMEROS = {n: p for n, p in enumerate(
    "cero una dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince "
    "dieciséis diecisiete dieciocho diecinueve veinte".split())}


def lee(*partes):
    with open(os.path.join(*partes), encoding="utf-8") as f:
        return f.read()


def corto(texto):
    return hashlib.sha256(texto.encode()).hexdigest()[:10]


def pieza(h):
    return lee(SRC, "herramientas", "piezas", h["pieza"] + ".html").rstrip() + "\n"


def url(h):
    return f"{DOMINIO}/herramientas/{h['slug']}/"


def og_imagen(h):
    if os.path.exists(os.path.join(WEB, "img", "og", h["slug"] + ".png")):
        return f"{DOMINIO}/img/og/{h['slug']}.png"
    return f"{DOMINIO}/img/og-herramientas.png"


def indice(enlace, sin=None):
    """Índice por grupos. enlace(h) devuelve el href de cada herramienta; sin, una que no se lista."""
    bloques = []
    for gid, gnombre in GRUPOS:
        hs = [h for h in HERRAMIENTAS if h["grupo"] == gid and h is not sin]
        if not hs:
            continue
        enlaces = "\n".join(f'        <a href="{enlace(h)}">{h["nombre"]}</a>' for h in hs)
        bloques.append(f'      <div class="idx-g">\n        <span class="idx-t">{gnombre}</span>\n{enlaces}\n      </div>')
    return "\n".join(bloques)


def pagina(titulo, descripcion, direccion, og, og_alt, contenido, jsonld, v_css, v_js):
    p = lee(SRC, "herramientas", "plantilla.html")
    for k, v in {
        "TITULO": html.escape(titulo, quote=True),
        "DESCRIPCION": html.escape(descripcion, quote=True),
        "OG_DESCRIPCION": html.escape(descripcion + " " + AMOR, quote=True),
        "URL": direccion,
        "OG_IMAGEN": og,
        "OG_ALT": html.escape(og_alt, quote=True),
        "JSONLD": json.dumps(jsonld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"),
        "V_CSS": v_css,
        "V_JS": v_js,
        "CONTENIDO": contenido.strip("\n"),
    }.items():
        p = p.replace("{{" + k + "}}", v)
    assert "{{" not in p, "Queda algún hueco sin rellenar en la plantilla"
    return p


def portada(v_css, v_js):
    n = len(HERRAMIENTAS)
    cuerpo = []
    for gid, gnombre in GRUPOS:
        hs = [h for h in HERRAMIENTAS if h["grupo"] == gid]
        if not hs:
            continue
        cuerpo.append(f'    <p class="grp">{gnombre}</p>\n')
        for h in hs:
            bloque = pieza(h)
            # El título de cada herramienta enlaza a su página propia.
            ini, fin = bloque.index("<h2>") + 4, bloque.index("</h2>")
            bloque = bloque[:ini] + f'<a href="/herramientas/{h["slug"]}/">' + bloque[ini:fin] + "</a>" + bloque[fin:]
            cuerpo.append("\n".join("    " + l if l else l for l in bloque.split("\n")))
    contenido = f"""
<section class="tools-hero">
  <div class="wrap">
    <h1>Herramientas <em>gratis</em></h1>
    <p class="lede" style="margin-top:20px">{NUMEROS.get(n, str(n)).capitalize()} herramientas para lo que se pregunta cada día en la sala de pesas, hechas por un usuario del gimnasio para todos los demás. Sin registro, sin correo y sin pagar nada: abre, usa y cierra. Funcionan desde el móvil, con el teléfono apoyado en el banco, y lo que escribes se queda en tu teléfono.</p>
    <nav class="idx" aria-label="Índice de herramientas">
{indice(lambda h: "#" + h["pieza"])}
    </nav>
  </div>
</section>

<section>
  <div class="wrap">

{"".join(cuerpo)}
    {lee(SRC, "herramientas", "piezas", "_pie.html").strip()}

  </div>
</section>
"""
    lista = [h["nombre"] for h in HERRAMIENTAS]
    descripcion = f"{', '.join(lista[:-1])} y {lista[-1]}. {NUMEROS.get(n, str(n)).capitalize()} herramientas de gimnasio gratis y sin registro."
    jsonld = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Herramientas gratis de gimnasio",
        "url": f"{DOMINIO}/herramientas/",
        "inLanguage": "es",
        "hasPart": [{"@type": "WebApplication", "name": h["h1"], "url": url(h)} for h in HERRAMIENTAS],
    }
    return pagina("Herramientas gratis — ArnoldWork", descripcion, f"{DOMINIO}/herramientas/",
                  f"{DOMINIO}/img/og-herramientas.png", "ArnoldWork · Herramientas gratis",
                  contenido, jsonld, v_css, v_js)


def individual(h, v_css, v_js):
    bloque = pieza(h)
    ini, fin = bloque.index("  <h2>"), bloque.index("</h2>") + len("</h2>\n")
    bloque = bloque[:ini] + bloque[fin:]  # el título ya es el h1 de la página
    bloque = "\n".join("    " + l if l else l for l in bloque.split("\n"))
    faq = "\n".join(
        f"      <details>\n        <summary>{p}</summary>\n        <p>{r}</p>\n      </details>" for p, r in h.get("faq", []))
    contenido = f"""
<section class="tools-hero">
  <div class="wrap">
    <nav class="migas" aria-label="Estás en"><a href="/herramientas/">Herramientas</a><span>/</span>{h["nombre"]}</nav>
    <h1>{h["h1"]}</h1>
    <p class="lede" style="margin-top:20px">{h["intro"]}</p>
  </div>
</section>

<section class="solo">
  <div class="wrap">

{bloque}
    <div class="articulo">
{h["articulo"].strip()}
    </div>
""" + (f"""
    <div class="faq">
      <h2>Preguntas frecuentes</h2>
{faq}
    </div>
""" if faq else "") + f"""
    <div class="otras">
      <h2>Más herramientas gratis</h2>
      <nav class="idx" aria-label="Otras herramientas">
{indice(lambda o: "/herramientas/" + o["slug"] + "/", sin=h)}
      </nav>
    </div>

    {lee(SRC, "herramientas", "piezas", "_pie.html").strip()}

  </div>
</section>
"""
    jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": h["h1"],
            "url": url(h),
            "description": h["descripcion"],
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Cualquiera (funciona en el navegador)",
            "inLanguage": "es",
            "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
            "publisher": {"@type": "Organization", "name": "ArnoldWork", "url": DOMINIO + "/"},
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Inicio", "item": DOMINIO + "/"},
                {"@type": "ListItem", "position": 2, "name": "Herramientas", "item": DOMINIO + "/herramientas/"},
                {"@type": "ListItem", "position": 3, "name": h["nombre"], "item": url(h)},
            ],
        },
    ]
    if h.get("faq"):
        jsonld.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": p,
                            "acceptedAnswer": {"@type": "Answer", "text": r}} for p, r in h["faq"]],
        })
    return pagina(f"{h['titulo']} — ArnoldWork", h["descripcion"], url(h), og_imagen(h),
                  f"ArnoldWork · {h['h1']}", contenido, jsonld, v_css, v_js)


def portada_web():
    """La portada (web/index.html) se edita a mano, pero la lista de herramientas y su número los pone build.py."""
    import re
    s = lee(WEB, "index.html")
    n = len(HERRAMIENTAS)
    enlaces = "\n".join(f'      <a href="/herramientas/{h["slug"]}/">{h["corto"]}</a>' for h in HERRAMIENTAS)
    s, k = re.subn(r'(<div class="toolnames"[^>]*>\n).*?(\n    </div>)', lambda m: m.group(1) + enlaces + m.group(2), s, flags=re.S)
    assert k == 1, "No encuentro la lista de herramientas de la portada"
    s = re.sub(r"\b\d+ herramientas\b", f"{n} herramientas", s)
    s = re.sub(r"\b\d+ HERRAMIENTAS\b", f"{n} HERRAMIENTAS", s)
    s = re.sub(r'(<div class="stat"><b>)\d+(</b><span>herramientas)', rf"\g<1>{n}\2", s)
    palabra = NUMEROS.get(n, str(n)).capitalize()
    s = re.sub(r"\b(Once|Doce|Trece|Catorce|Quince|Dieciséis|Diecisiete|Dieciocho|Diecinueve|Veinte) herramientas\b", palabra + " herramientas", s)
    return s


def generar():
    """Devuelve {ruta relativa dentro de web/: contenido}."""
    css = lee(SRC, "herramientas", "estilos.css")
    js = lee(SRC, "herramientas", "app.js")
    v_css, v_js = corto(css), corto(js)
    salida = {
        "index.html": portada_web(),
        "herramientas/estilos.css": css,
        "herramientas/app.js": js,
        "herramientas/index.html": portada(v_css, v_js),
    }
    slugs = [h["slug"] for h in HERRAMIENTAS]
    assert len(set(slugs)) == len(slugs), "Hay dos herramientas con la misma dirección"
    for h in HERRAMIENTAS:
        salida[f"herramientas/{h['slug']}/index.html"] = individual(h, v_css, v_js)

    paginas = ["/", "/herramientas/"] + [f"/herramientas/{s}/" for s in slugs]
    precache = paginas + ["/404.html", f"/herramientas/estilos.css?v={v_css}", f"/herramientas/app.js?v={v_js}",
                          "/img/logo.svg", "/favicon.svg", "/manifest.webmanifest"]
    version = corto("".join(salida.values()) + lee(WEB, "404.html"))
    salida["sw.js"] = (lee(SRC, "sw.js").replace("{{VERSION}}", version)
                       .replace("{{PRECACHE}}", json.dumps(precache, ensure_ascii=False)))

    hoy = os.environ.get("FECHA_SITEMAP") or date.today().isoformat()
    urls = [("/", "weekly", "1.0"), ("/herramientas/", "weekly", "0.9")] + \
           [(f"/herramientas/{s}/", "monthly", "0.8") for s in slugs]
    salida["sitemap.xml"] = ('<?xml version="1.0" encoding="UTF-8"?>\n'
                             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                             "".join(f"  <url>\n    <loc>{DOMINIO}{u}</loc>\n    <lastmod>{hoy}</lastmod>\n"
                                     f"    <changefreq>{c}</changefreq>\n    <priority>{p}</priority>\n  </url>\n"
                                     for u, c, p in urls) +
                             "</urlset>\n")
    return salida


def main():
    comprobar = "--check" in sys.argv
    if comprobar:
        # La fecha del sitemap no cuenta como cambio.
        actual = os.path.join(WEB, "sitemap.xml")
        if os.path.exists(actual):
            import re
            m = re.search(r"<lastmod>([^<]+)</lastmod>", lee(actual))
            if m:
                os.environ["FECHA_SITEMAP"] = m.group(1)
    salida = generar()
    distintos = []
    for ruta, contenido in salida.items():
        destino = os.path.join(WEB, ruta)
        viejo = lee(destino) if os.path.exists(destino) else None
        if viejo == contenido:
            continue
        distintos.append(ruta)
        if not comprobar:
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            with open(destino, "w", encoding="utf-8") as f:
                f.write(contenido)
    if comprobar:
        if distintos:
            print("web/ no está al día con src/. Ejecuta: python3 build.py")
            print("\n".join("  " + d for d in distintos))
            sys.exit(1)
        print("web/ está al día.")
    else:
        print(f"{len(salida)} archivos; cambiados: {len(distintos)}")
        for d in distintos:
            print("  " + d)


if __name__ == "__main__":
    main()
