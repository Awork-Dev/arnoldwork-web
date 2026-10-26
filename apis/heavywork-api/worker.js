// Worker "heavywork-api": copia en la nube de HeavyWork, opcional y sin cuentas.
// Quien activa la nube recibe un código (XXXX-XXXX). Solo se guarda el resumen de su cuaderno;
// el código no se guarda: en la base de datos va su huella (SHA-256), así que nadie puede leerlo.
// Base de datos D1 enlazada como DB (ver schema.sql).

const ORIGENES = ['https://heavywork.arnoldwork.com', 'https://arnoldwork.com'];
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANO_MAXIMO = 2 * 1024 * 1024;

function cabeceras(request) {
    const origen = request.headers.get('Origin') || '';
    return {
        'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Cache-Control': 'no-store',
    };
}

function respuesta(request, cuerpo, estado = 200) {
    return new Response(cuerpo === null ? null : JSON.stringify(cuerpo), {
        status: estado,
        headers: { ...cabeceras(request), 'Content-Type': 'application/json; charset=utf-8' },
    });
}

function codigoNuevo() {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const letras = Array.from(bytes, b => ALFABETO[b % ALFABETO.length]).join('');
    return `${letras.slice(0, 4)}-${letras.slice(4)}`;
}

async function huella(codigo) {
    const datos = new TextEncoder().encode(codigo.replace(/-/g, '').toUpperCase());
    const hash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

async function leerCuerpo(request) {
    const texto = await request.text();
    if (texto.length > TAMANO_MAXIMO) return { error: 'demasiado-grande' };
    try {
        const cuerpo = JSON.parse(texto);
        if (!cuerpo || typeof cuerpo.datos !== 'object' || cuerpo.datos === null) return { error: 'formato' };
        return { datos: cuerpo.datos };
    } catch {
        return { error: 'formato' };
    }
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: cabeceras(request) });

        const url = new URL(request.url);
        const partes = url.pathname.split('/').filter(Boolean);
        if (partes[0] !== 'api' || partes[1] !== 'copias') return respuesta(request, { error: 'no-existe' }, 404);

        // POST /api/copias → crea la copia y devuelve el código (solo se muestra una vez).
        if (partes.length === 2 && request.method === 'POST') {
            const cuerpo = await leerCuerpo(request);
            if (cuerpo.error) return respuesta(request, cuerpo, 400);
            const codigo = codigoNuevo();
            const ahora = Date.now();
            await env.DB.prepare('INSERT INTO copias (huella, datos, creada, actualizada) VALUES (?, ?, ?, ?)')
                .bind(await huella(codigo), JSON.stringify(cuerpo.datos), ahora, ahora).run();
            return respuesta(request, { codigo, actualizada: ahora }, 201);
        }

        if (partes.length !== 3) return respuesta(request, { error: 'no-existe' }, 404);
        const codigo = decodeURIComponent(partes[2]);
        if (!/^[A-Z2-9]{4}-?[A-Z2-9]{4}$/i.test(codigo)) return respuesta(request, { error: 'codigo' }, 400);
        const id = await huella(codigo);
        const fila = await env.DB.prepare('SELECT datos, actualizada FROM copias WHERE huella = ?').bind(id).first();
        if (!fila) return respuesta(request, { error: 'no-encontrado' }, 404);

        // GET /api/copias/:codigo → recupera los datos.
        if (request.method === 'GET') {
            return respuesta(request, { datos: JSON.parse(fila.datos), actualizada: fila.actualizada });
        }

        // PUT /api/copias/:codigo → sustituye la copia por la versión actual del móvil.
        if (request.method === 'PUT') {
            const cuerpo = await leerCuerpo(request);
            if (cuerpo.error) return respuesta(request, cuerpo, 400);
            const ahora = Date.now();
            await env.DB.prepare('UPDATE copias SET datos = ?, actualizada = ? WHERE huella = ?')
                .bind(JSON.stringify(cuerpo.datos), ahora, id).run();
            return respuesta(request, { actualizada: ahora });
        }

        // DELETE /api/copias/:codigo → borra la copia de la nube.
        if (request.method === 'DELETE') {
            await env.DB.prepare('DELETE FROM copias WHERE huella = ?').bind(id).run();
            return respuesta(request, null, 204);
        }

        return respuesta(request, { error: 'metodo' }, 405);
    },
};
