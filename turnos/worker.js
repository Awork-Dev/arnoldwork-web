// TurnoWork: sirve la web (carpeta web/) y pasa al vigilante la sincronización (/api/…) y el calendario (/cal/…).
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/cal/")) return env.VIGILANTE.fetch(req);
    return env.ASSETS.fetch(req);
  },
};
