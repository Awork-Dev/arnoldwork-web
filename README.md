# ArnoldWork · web

- `web/` — arnoldwork.com (Worker `arnoldwork-v11`, `wrangler.jsonc`).
  Las páginas de herramientas se generan con `python3 build.py` a partir de `src/`.
- `heavywork/web/` — heavywork.arnoldwork.com (Worker `heavywork`, `heavywork/wrangler.jsonc`), con el juego CaveWork en `/game/`.
- `vigilante/` — Worker `vigilante`, que avisa por Telegram si algo se cae.
- `.github/workflows/` — publican solos con el secreto `CLOUDFLARE_API_TOKEN`:
  push a `main` → producción; push a otra rama → vista previa en `*.arnoldwork.workers.dev`.
