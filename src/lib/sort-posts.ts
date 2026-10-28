import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'writing'>;

/** Newest first; posts sharing a date fall back to file path so their order stays stable. */
export function newestFirst(a: Post, b: Post): number {
  const byDate = b.data.date.getTime() - a.data.date.getTime();
  if (byDate !== 0) return byDate;
  const pathA = a.filePath ?? a.id;
  const pathB = b.filePath ?? b.id;
  return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
}
