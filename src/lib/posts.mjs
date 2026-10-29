// Post IDs and dates, shared by the content collection and the sitemap.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const POST_FOLDERS = ['articles', 'daily-logs'];

/** `articles/2025-01-15-my-post.md` becomes `my-post`; daily logs keep their date prefix. */
export function postId(entry) {
  const id = entry.replace(/^(articles|daily-logs)\//, '').replace(/\.md$/, '');
  return entry.startsWith('articles/') ? id.replace(/^\d{4}-\d{2}-\d{2}-/, '') : id;
}

/** Map each post's URL path to its frontmatter `updated` date, or `date` when it has none. */
export function postLastModified(contentDir) {
  const dates = new Map();
  for (const folder of POST_FOLDERS) {
    for (const file of readdirSync(join(contentDir, folder))) {
      if (!file.endsWith('.md')) continue;
      const source = readFileSync(join(contentDir, folder, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*(\\d{4}-\\d{2}-\\d{2})\\s*$`, 'm'))?.[1];
      const lastModified = field('updated') ?? field('date');
      if (lastModified) dates.set(`/articles/${postId(`${folder}/${file}`)}/`, lastModified);
    }
  }
  return dates;
}
