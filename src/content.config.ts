import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { postId } from './lib/posts.mjs';

const writing = defineCollection({
  loader: glob({
    pattern: [
      'articles/*.md',  // Match .md files in articles/ folder
      'daily-logs/*.md', // Match .md files in daily-logs/ folder
      '!_draft/**/*.md', // Exclude all markdown files in _draft folder
      '!.*/**.md',      // Exclude hidden folders (starting with .)
      '!*.md',          // Exclude root-level markdown files
      '!images/*.md',   // Exclude markdown files in images folder
    ],
    base: './src/content/writing',
    generateId: ({ entry }) => postId(entry),
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    // Set when a published post changes meaningfully; used for sitemap lastmod and dateModified.
    updated: z.date().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  writing,
};