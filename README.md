# ArnoldWork · web

- `web/` — la web que se publica en https://arnoldwork.com (Cloudflare Pages).
- `vigilante/` — Worker de Cloudflare que avisa por Telegram si algo se cae.
- `.github/workflows/desplegar.yml` — publica `web/` automáticamente:
  push a `main` → producción; push a otra rama → vista previa en `*.pages.dev`.
