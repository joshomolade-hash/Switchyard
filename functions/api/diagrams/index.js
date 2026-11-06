import { json } from '../_auth.js';

export async function onRequestGet({ env, data }) {
  const { results } = await env.DB.prepare(
    'SELECT id, title, created_at, updated_at, nodes, edges, thumb FROM diagrams WHERE user = ?1 ORDER BY updated_at DESC LIMIT 1000'
  ).bind(data.user).all();
  return json({
    diagrams: results.map((r) => ({
      kind: 'meta', id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at,
      nodes: r.nodes, edges: r.edges, thumb: r.thumb,
    })),
  });
}
