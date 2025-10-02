import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('writing');

  // Sort articles by date (newest first)
  const sortedArticles = articles.sort((a, b) =>
    b.data.date.getTime() - a.data.date.getTime()
  );

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
    customData: `<language>en-us</language>`,
  });
}