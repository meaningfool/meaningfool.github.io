// Each article's share image, /articles/<slug>/share.png: its title, date and reading time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { articleImage } from '../../../lib/share-images';
import { articleMeta, articlesOnly } from '../../../lib/share';

export const getStaticPaths: GetStaticPaths = async () =>
  articlesOnly(await getCollection('writing')).map((article) => ({ params: { slug: article.id }, props: { article } }));

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as { article: CollectionEntry<'writing'> };
  const image = await articleImage({ title: article.data.title, meta: articleMeta(article).line });
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
