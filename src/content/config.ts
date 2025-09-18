import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({
    pattern: [
      'articles/*.md',  // Match .md files in articles/ folder
      'daily-logs/*.md', // Match .md files in daily-logs/ folder
      '!.*/**.md',      // Exclude hidden folders (starting with .)
      '!*.md',          // Exclude root-level markdown files
      '!images/*.md',   // Exclude markdown files in images folder
    ],
    base: './src/content/writing',
    generateId: ({ entry }) => {
      // Strip folder prefix and .md extension
      let id = entry.replace(/^(articles|daily-logs)\//, '').replace(/\.md$/, '');

      // Only strip date prefix from articles (not daily-logs)
      if (entry.startsWith('articles/')) {
        id = id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
      }

      return id;
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