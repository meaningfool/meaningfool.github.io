import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({
    pattern: [
      'articles/*.md',  // Match .md files in articles/ folder
      'daily-logs/*.md', // Match .md files in daily-logs/ folder
      '!.*/**.md',      // Exclude hidden folders (starting with .)
      '!*.md',          // Exclude root-level markdown files
    ],
    base: './src/content/writing',
    generateId: ({ entry }) => {
      // Strip folder prefix (articles/ or daily-logs/) and .md extension
      return entry.replace(/^(articles|daily-logs)\//, '').replace(/\.md$/, '');
    }
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  writing,
};