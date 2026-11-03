// The favicon as an SVG, the 32px tile, for the browsers that take one.
import type { APIRoute } from 'astro';
import { tileSvg } from '../lib/favicon';

export const GET: APIRoute = () => new Response(tileSvg(32), { headers: { 'Content-Type': 'image/svg+xml' } });
