#!/usr/bin/env python3
"""Pone el contador de visitas de Cloudflare Web Analytics en todas las páginas antes de publicar.

Cloudflare no inyecta solo el contador en las páginas que sirve un Worker, así que sin esto
casi no se registran visitas. Lo usan los flujos de publicación:

    python3 analitica.py web             # arnoldwork.com
    python3 analitica.py heavywork/web   # heavywork.arnoldwork.com

No guarda cookies ni identifica a nadie (lo que dice el aviso legal). El token no es secreto:
va en el código de la página, a la vista de cualquiera.
"""
import pathlib
import sys

TOKEN = "PENDIENTE"  # Cloudflare → Análisis web → arnoldwork.com → Administrar sitio → fragmento JS

CONTADOR = ("<script defer src='https://static.cloudflareinsights.com/beacon.min.js' "
            f"data-cf-beacon='{{\"token\": \"{TOKEN}\"}}'></script>")


def main():
    if len(sys.argv) != 2:
        sys.exit("uso: python3 analitica.py <carpeta>")
    if TOKEN == "PENDIENTE":
        print("analitica.py: falta el token de Cloudflare, no se añade el contador")
        return
    carpeta = pathlib.Path(sys.argv[1])
    cambiadas = 0
    for f in sorted(carpeta.rglob("*.html")):
        texto = f.read_text(encoding="utf-8")
        if "cloudflareinsights.com/beacon" in texto or "</body>" not in texto:
            continue
        i = texto.rfind("</body>")
        f.write_text(texto[:i] + CONTADOR + "\n" + texto[i:], encoding="utf-8")
        cambiadas += 1
    print(f"analitica.py: contador añadido en {cambiadas} páginas de {carpeta}")


if __name__ == "__main__":
    main()
