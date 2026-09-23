// CaveWork API: shared Top 10 + symbolic debt counter
// Cloudflare Worker with a D1 database bound as "DB".

const ALLOWED_ORIGINS = [
    'https://heavywork.arnoldwork.workers.dev',
    'https://heavywork.arnoldwork.com',
    'https://arnoldwork.com',
    'https://www.arnoldwork.com',
];
const CENTS_PER_GAME = 10;
const BLOCKED = ['ASS', 'FUK', 'FCK', 'FUC', 'SEX', 'KKK', 'NAZ', 'CUM', 'DIK', 'DIC', 'TIT', 'PIS', 'FAG', 'NIG', 'GAY', 'WTF', 'XXX', 'PUT', 'PTA', 'CUL', 'MRD', 'POL', 'PEN', 'VAG', 'ANO', 'JOD', 'HDP', 'KYS'];

let ready = false;
async function setup(db) {
    if (ready) return;
    await db.batch([
        db.prepare('CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY CHECK (id = 1), plays INTEGER NOT NULL DEFAULT 0)'),
        db.prepare('INSERT OR IGNORE INTO stats (id, plays) VALUES (1, 0)'),
        db.prepare('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, started INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)'),
        db.prepare('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, created INTEGER NOT NULL)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores (score DESC)'),
        db.prepare('CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT NOT NULL, name TEXT, message TEXT NOT NULL, created INTEGER NOT NULL)'),
    ]);
    ready = true;
}

function cors(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost');
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

const json = (data, status, headers) =>
    new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

async function top10(db) {
    const { results } = await db.prepare('SELECT name, score, level, created AS date FROM scores ORDER BY score DESC, created ASC LIMIT 10').all();
    return results;
}

async function stats(db) {
    const row = await db.prepare('SELECT plays FROM stats WHERE id = 1').first();
    const plays = row ? row.plays : 0;
    return { plays, debtCents: plays * CENTS_PER_GAME, debt: (plays * CENTS_PER_GAME) / 100 };
}

export default {
    async fetch(request, env) {
        const h = cors(request);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
        if (!env.DB) return json({ error: 'Database not connected' }, 500, h);

        const { pathname } = new URL(request.url);
        try {
            await setup(env.DB);

            if (pathname === '/state' && request.method === 'GET') {
                return json({ ...(await stats(env.DB)), top: await top10(env.DB) }, 200, h);
            }

            if (pathname === '/play' && request.method === 'POST') {
                const runId = crypto.randomUUID();
                const now = Date.now();
                await env.DB.batch([
                    env.DB.prepare('UPDATE stats SET plays = plays + 1 WHERE id = 1'),
                    env.DB.prepare('INSERT INTO runs (id, started) VALUES (?, ?)').bind(runId, now),
                    env.DB.prepare('DELETE FROM runs WHERE started < ?').bind(now - 24 * 3600 * 1000),
                ]);
                return json({ runId, ...(await stats(env.DB)) }, 200, h);
            }

            if (pathname === '/score' && request.method === 'POST') {
                let body;
                try { body = await request.json(); } catch { return json({ error: 'Invalid data' }, 400, h); }
                const name = String(body.name || '').toUpperCase();
                const score = Math.floor(Number(body.score));
                const level = Math.floor(Number(body.level));
                if (!/^[A-Z]{3}$/.test(name) || BLOCKED.includes(name)) return json({ error: 'Invalid initials' }, 400, h);
                if (!Number.isFinite(score) || score < 1 || !Number.isFinite(level) || level < 1 || level > 99) return json({ error: 'Invalid score' }, 400, h);

                const run = await env.DB.prepare('SELECT started, used FROM runs WHERE id = ?').bind(String(body.runId || '')).first();
                if (!run || run.used) return json({ error: 'Unknown game' }, 400, h);

                // Plausibility checks: points per second and levels per second
                const seconds = (Date.now() - run.started) / 1000;
                const maxScore = seconds * 1500 + 500 * level * level + 2000;
                const maxLevel = Math.floor(seconds / 12) + 2;
                if (seconds < 3 || score > maxScore || level > maxLevel) return json({ error: 'Score not accepted' }, 400, h);

                await env.DB.batch([
                    env.DB.prepare('UPDATE runs SET used = 1 WHERE id = ?').bind(String(body.runId)),
                    env.DB.prepare('INSERT INTO scores (name, score, level, created) VALUES (?, ?, ?, ?)').bind(name, score, level, Date.now()),
                    env.DB.prepare('DELETE FROM scores WHERE id NOT IN (SELECT id FROM scores ORDER BY score DESC, created ASC LIMIT 200)'),
                ]);
                return json({ ok: true, top: await top10(env.DB) }, 200, h);
            }

            if (pathname === '/feedback' && request.method === 'POST') {
                let body;
                try { body = await request.json(); } catch { return json({ error: 'Invalid data' }, 400, h); }
                if (body.web) return json({ ok: true }, 200, h);   // honeypot: bots
                const message = String(body.message || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, 280);
                const name = String(body.name || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                const best = Math.max(0, Math.floor(Number(body.best) || 0));
                if (message.length < 3) return json({ error: 'Message too short' }, 400, h);

                // Max 3 messages per hour per visitor (IP stored only as a hash)
                const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
                const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cavework:' + ip));
                const who = [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
                const now = Date.now();
                const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE who = ? AND created > ?').bind(who, now - 3600 * 1000).first();
                if (recent && recent.n >= 3) return json({ error: 'Too many messages' }, 429, h);

                await env.DB.prepare('INSERT INTO feedback (who, name, message, created) VALUES (?, ?, ?, ?)').bind(who, name || null, message, now).run();

                if (env.TELEGRAM_TOKEN && env.TELEGRAM_CHAT_ID) {
                    const text = `🦖 CaveWork feedback\n\n${message}\n\n👤 ${name || 'Anonymous'} · Best: ${best.toLocaleString('en-US')}`;
                    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
                    }).catch(() => { });
                }
                return json({ ok: true }, 200, h);
            }

            return json({ error: 'Not found' }, 404, h);
        } catch (e) {
            return json({ error: 'Server error' }, 500, h);
        }
    },
};