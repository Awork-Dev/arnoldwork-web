#!/bin/sh
# Lo usa Cloudflare (Workers Builds) para publicar arnoldwork.com: genera las herramientas y pone la versión.
set -e
python3 build.py
printf '{"version":"%s","fecha":"%s"}\n' "$(git rev-parse --short HEAD)" "$(git log -1 --format=%cI)" > web/version.json
echo "Lista la versión $(git rev-parse --short HEAD)"
