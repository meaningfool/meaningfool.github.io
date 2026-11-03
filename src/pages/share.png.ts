// The share image of Home and About, /share.png. The activity logs use it too.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteImage } from '../lib/share-images';
import { HOME_INTRO, siteCounts } from '../lib/share';

export const GET: APIRoute = async () => {
  const image = await siteImage({ intro: HOME_INTRO, counts: siteCounts(await getCollection('writing')) });
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
