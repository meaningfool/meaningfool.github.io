// The favicon for the browsers that don't take the SVG, at 16px and 32px.
import type { APIRoute } from 'astro';
import { tileIco } from '../lib/favicon';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await tileIco([16, 32])), { headers: { 'Content-Type': 'image/x-icon' } });
