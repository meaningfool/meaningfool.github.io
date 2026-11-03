// The 180px icon that iPhones and iPads put on the home screen.
import type { APIRoute } from 'astro';
import { tilePng } from '../lib/favicon';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await tilePng(180)), { headers: { 'Content-Type': 'image/png' } });
