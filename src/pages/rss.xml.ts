import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { newestFirst } from '../lib/sort-posts';

export async function GET(context: APIContext) {
  const articles = await getCollection('writing');

  const sortedArticles = articles.sort(newestFirst);

  return rss({
    title: 'meaningfool',
    description: 'Personal site of Josselin Perrus, product manager in Paris',
    site: context.site!,
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      description: article.data.description || '',
      pubDate: article.data.date,
      link: `/articles/${article.id}/`,
    })),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-us</language><atom:link href="${new URL('/rss.xml', context.site)}" rel="self" type="application/rss+xml"/>`,
  });
}