#!/bin/sh
# Lo usa Cloudflare (Workers Builds) para publicar heavywork.arnoldwork.com: pone la versión que lee «Buscar actualización».
set -e
printf '{"version":"%s","fecha":"%s"}\n' "$(git rev-parse --short HEAD)" "$(git log -1 --format=%cI)" > web/version.json
echo "Lista la versión $(git rev-parse --short HEAD)"
