import { identify, json } from './_auth.js';

// Creates the table on first use, so a fresh database needs no manual migration.
// Kept in step with migrations/0001_init.sql.
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS diagrams (
      user TEXT NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      nodes INTEGER NOT NULL DEFAULT 0, edges INTEGER NOT NULL DEFAULT 0,
      thumb TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, PRIMARY KEY (user, id))`),
    db.prepare('CREATE INDEX IF NOT EXISTS diagrams_by_user_updated ON diagrams (user, updated_at DESC)'),
  ]);
  schemaReady = true;
}

// Every /api route needs a signed-in user (via Cloudflare Access) and the D1 binding.
export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'Storage is not configured on this server.' }, 503);
  let user = null;
  try { user = await identify(request, env); } catch { return json({ error: 'Sign-in could not be checked.' }, 503); }
  if (!user) return json({ error: 'Not signed in.' }, 401);
  context.data.user = user;
  try { await ensureSchema(env.DB); } catch { return json({ error: 'Storage is not ready yet.' }, 503); }
  // Same-origin writes only: a basic CSRF guard on top of Access.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json({ error: 'Cross-site request refused.' }, 403);
  }
  return context.next();
}
