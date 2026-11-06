import { identify, json } from './_auth.js';

// Every /api route needs a signed-in user (via Cloudflare Access) and the D1 binding.
export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'Storage is not configured on this server.' }, 503);
  let user = null;
  try { user = await identify(request, env); } catch { return json({ error: 'Sign-in could not be checked.' }, 503); }
  if (!user) return json({ error: 'Not signed in.' }, 401);
  context.data.user = user;
  // Same-origin writes only: a basic CSRF guard on top of Access.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json({ error: 'Cross-site request refused.' }, 403);
  }
  return context.next();
}
