import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({
    pattern: [
      '*/**.md',        // Include markdown files only from visible folders
      '!.*/**.md',      // Exclude hidden folders (starting with .)
      '!*.md',          // Exclude root-level markdown files
    ],
    base: './src/content/writing'
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