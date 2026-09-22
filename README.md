# ArnoldWork · web

- `web/` — la web de https://arnoldwork.com (Worker `arnoldwork-v11`, con `wrangler.jsonc`).
- `vigilante/` — Worker `vigilante`, que avisa por Telegram si algo se cae.
- `.github/workflows/` — publican solos con el secreto `CLOUDFLARE_API_TOKEN`:
  - push a `main` → arnoldwork.com (y el vigilante, si cambia);
  - push a otra rama → vista previa en `https://<rama>-arnoldwork-v11.arnoldwork.workers.dev`.
