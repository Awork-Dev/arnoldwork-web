// ArnoldWork API: recibe los leads de la web y los envia a Telegram.

const ALLOWED_ORIGINS = [
  'https://arnoldwork.com',
  'https://www.arnoldwork.com',
  'https://arnoldwork.arnoldwork.workers.dev',
];

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = true;
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({}, headers, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  });
}

function clean(value) {
  const raw = (value === undefined || value === null) ? '' : String(value);
  let out = '';
  for (const ch of raw) {
    const code = ch.codePointAt(0);
    out += (code < 32 || code === 127) ? ' ' : ch;
  }
  out = out.trim().slice(0, 300);
  return out === '' ? '-' : out;
}

export default {
  async fetch(request, env) {
    const h = cors(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    const pathname = new URL(request.url).pathname;
    if (pathname !== '/lead') return json({ error: 'Not found' }, 404, h);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, h);

    const TOKEN = env.TELEGRAM_TOKEN || env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;
    if (!TOKEN || !CHAT_ID) return json({ error: 'config' }, 500, h);

    let lead;
    try {
      lead = await request.json();
    } catch (e) {
      return json({ error: 'json' }, 400, h);
    }

    let lineas;
    if (lead.tipo === 'guia') {
      lineas = [
        'Guia gratuita solicitada',
        '',
        'Correo: ' + clean(lead.contacto),
        '',
        'Enviale "Cuando subir peso" y anadelo a la lista de correo.',
        clean(lead.fecha),
      ];
    } else {
      lineas = [
        'Nuevo lead desde arnoldwork.com',
        '',
        'Nombre: ' + clean(lead.nombre),
        'Objetivo: ' + clean(lead.objetivo),
        'Nivel: ' + clean(lead.nivel),
        'Dias/semana: ' + clean(lead.frecuencia),
        'Contacto: ' + clean(lead.contacto),
        '',
        'Plan sugerido: ' + clean(lead.planSugerido),
        clean(lead.fecha),
      ];
    }
    const texto = lineas.join('\n');

    try {
      const r = await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: texto }),
      });
      if (!r.ok) return json({ error: 'telegram' }, 502, h);
      return json({ ok: true }, 200, h);
    } catch (e) {
      return json({ error: 'red' }, 502, h);
    }
  },
};