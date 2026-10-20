# ArnoldWork · web

- `web/` — arnoldwork.com (Worker `arnoldwork-v11`, `wrangler.jsonc`).
  Las páginas de herramientas se generan con `python3 build.py` a partir de `src/`.
- `heavywork/web/` — heavywork.arnoldwork.com (Worker `heavywork`, `heavywork/wrangler.jsonc`), con el juego CaveWork en `/game/`.
- `cavework/` — Worker `cavework-ranking`: ranking mundial de CaveWork (Top 50, campeón de la semana, reto diario, ligas y temporadas mensuales).
- VidaWork (antes TurnoWork; vida.arnoldwork.com, la antigua turnos.arnoldwork.com sigue funcionando) vive en su propio repositorio, Awork-Dev/TurnoWork: tu trabajo, tu familia y tus viajes en una sola app. Pro (2,99 €) se compra en Ko-fi y se activa con el correo: el vigilante guarda la compra (`PRO_KOFI` en `vigilante.js`) y responde a `POST /pro`.
- `calas/` — Calas Hoy (Worker `calas`, calas.arnoldwork.workers.dev): a qué cala de Mallorca ir según viento, olas y lluvia (Open-Meteo, en el navegador).
- `vigilante/` — Worker `vigilante`, los automatismos:
  - cada 30 min revisa webs y APIs (caídas y lentitud) y avisa por Telegram, también de un nuevo nº 1 en CaveWork;
  - cada mañana, resumen diario y aviso si el dominio va a caducar;
  - cada viernes, noticias y estudios de la semana sobre hipertrofia y Heavy Duty (`noticias.js`: PubMed y Google Noticias);
  - cada lunes, resumen de la semana y copia de seguridad del ranking y de los contactos;
  - `POST /kofi`: avisos de ventas y batidos de Ko-fi; `POST /contacto`: copia de los mensajes del chat.
  - Secretos: `TELEGRAM_TOKEN`, `KOFI_TOKEN`, `PRUEBA_CLAVE`.
- `apis/` — Workers `arnoldwork-api` (chat y guía → Telegram) y `cavework-api` (partidas, «deuda» y comentarios del juego, con D1).
  Se trajeron de Cloudflare con el flujo «Traer APIs de Cloudflare» (se lanza a mano).
- `pruebas/` — pruebas automáticas (`node pruebas.mjs web` / `heavywork`) que se pasan antes de cada publicación.
- `.github/workflows/` — publican solos con el secreto `CLOUDFLARE_API_TOKEN`:
  push a `main` → producción; push a otra rama → vista previa en `*.arnoldwork.workers.dev`.

## Detalle escondido: el pez ΙΧΘΥΣ

Es un detalle escondido a propósito: no se anuncia en la app ni en la guía. El autor es creyente y quiere que en todas sus apps haya un pequeño pez ΙΧΘΥΣ (Ichthys, el símbolo con el que se reconocían los primeros cristianos: «Jesús Cristo, Hijo de Dios, Salvador») que, al tocarlo, muestre un versículo. Textos libres de derechos: Reina-Valera 1909 (castellano), King James (inglés) y Lutero 1912 (alemán); sale el del idioma de la página. **Al rediseñar o limpiar, no lo quites.**

- Código: `src/ichthys.js` (con los versículos de todas las apps); `build.py` lo copia a `web/ichthys.js` y `heavywork/web/ichthys.js` y pone su versión en `web/index.html`.
- **ArnoldWork** (pie, junto a «la casa de ARNOLD»): Filipenses 4:13 (`data-v="fil4"`).
- **HeavyWork** (pie, junto a «la casa de ARNOLD»): 2 Timoteo 4:7 (`data-v="tim4"`).
- **CaveWork** (menú principal, bajo el subtítulo; en `game/` y `app/`): Juan 8:12 (`data-v="jn8"`).
- Se coloca con `<script src="/ichthys.js" data-v="…" data-donde="selector" data-color="#…">`: el pez va justo después del elemento de `data-donde`.
