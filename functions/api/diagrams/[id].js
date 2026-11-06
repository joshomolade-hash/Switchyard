import { json } from '../_auth.js';

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_BODY = 1_800_000; // D1 rows top out near 2 MB
const MAX_THUMB = 120_000;
const MAX_DIAGRAMS = 1000;

export async function onRequestGet({ env, data, params }) {
  if (!ID.test(params.id)) return json({ error: 'Bad id.' }, 400);
  const row = await env.DB.prepare(
    'SELECT id, title, created_at, updated_at, nodes, edges, body FROM diagrams WHERE user = ?1 AND id = ?2'
  ).bind(data.user, params.id).first();
  if (!row) return json({ error: 'Not found.' }, 404);
  return json({ id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at, body: row.body });
}

export async function onRequestPut({ env, data, params, request }) {
  if (!ID.test(params.id)) return json({ error: 'Bad id.' }, 400);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Body must be JSON.' }, 400); }
  const body = payload && payload.body;
  const meta = (payload && payload.meta) || {};
  if (typeof body !== 'string') return json({ error: 'Missing diagram body.' }, 400);
  if (body.length > MAX_BODY) return json({ error: 'This diagram is too large to save. Remove or shrink images.' }, 413);
  let doc;
  try { doc = JSON.parse(body); } catch { return json({ error: 'Diagram body is not valid JSON.' }, 400); }
  if (!doc || !Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) return json({ error: 'Not a Switchyard diagram.' }, 400);
  const title = String(meta.title || doc.title || 'Untitled diagram').slice(0, 200);
  const thumb = typeof meta.thumb === 'string' && meta.thumb.length <= MAX_THUMB && meta.thumb.startsWith('<svg') ? meta.thumb : '';
  const now = Date.now();

  const exists = await env.DB.prepare('SELECT 1 FROM diagrams WHERE user = ?1 AND id = ?2').bind(data.user, params.id).first();
  if (!exists) {
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM diagrams WHERE user = ?1').bind(data.user).first();
    if (n >= MAX_DIAGRAMS) return json({ error: `You have reached ${MAX_DIAGRAMS} diagrams. Delete some to save new ones.` }, 413);
  }
  await env.DB.prepare(
    `INSERT INTO diagrams (user, id, title, created_at, updated_at, nodes, edges, thumb, body)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT (user, id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at,
       nodes = excluded.nodes, edges = excluded.edges, thumb = excluded.thumb, body = excluded.body`
  ).bind(data.user, params.id, title, Number(meta.createdAt) || now, now, doc.nodes.length, doc.edges.length, thumb, body).run();
  return json({ ok: true, updatedAt: now });
}

export async function onRequestDelete({ env, data, params }) {
  if (!ID.test(params.id)) return json({ error: 'Bad id.' }, 400);
  await env.DB.prepare('DELETE FROM diagrams WHERE user = ?1 AND id = ?2').bind(data.user, params.id).run();
  return new Response(null, { status: 204 });
}
