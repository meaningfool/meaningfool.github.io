// What the share images say and where they are served, for the endpoints that draw them (src/lib/share-images.ts)
// and the pages whose og:image they are.
import type { CollectionEntry } from 'astro:content';
import { isDailyLog } from './posts.mjs';
import { readingMinutes } from './reading-time.mjs';
import { projects } from '../data/projects';

type Post = CollectionEntry<'writing'>;

export interface Share {
  path: string;
  alt: string;
}

/** The home's intro, which the share image of Home and About repeats under the name. */
export const HOME_INTRO =
  "I'm a product manager building AI products with AI. My projects are an opportunity to test ideas and learn in public.";

/** The share image of Home and About. The activity logs, which have none of their own, use it too. */
export const SITE_SHARE: Share = { path: '/share.png', alt: `Josselin Perrus. ${HOME_INTRO}` };

/** "18 articles", "1 project" */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** "May 27, 2026": the date in the content is a day, which UTC keeps whatever the build machine's time zone. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** The articles, not the activity logs. */
export const articlesOnly = (posts: Post[]) => posts.filter((post) => !isDailyLog(post));

/** "18 articles · 3 projects", for the share image of Home and About. */
export function siteCounts(posts: Post[]): string {
  return `${plural(articlesOnly(posts).length, 'article')} · ${plural(projects.length, 'project')}`;
}

/** An article's date and reading time, as its share image shows them: "May 27, 2026 · 3 min read". */
export function articleMeta(article: Post): { date: string; minutes: number; line: string } {
  const date = formatDate(article.data.date);
  const minutes = readingMinutes(article.body);
  return { date, minutes, line: `${date} · ${minutes} min read` };
}

/** A post's share image: its own for an article, the site's for an activity log. */
export function postShare(post: Post): Share {
  if (isDailyLog(post)) return SITE_SHARE;
  const { date, minutes } = articleMeta(post);
  return {
    path: `/articles/${post.id}/share.png`,
    alt: `${post.data.title}. Josselin Perrus, ${date}, ${minutes} min read.`,
  };
}
