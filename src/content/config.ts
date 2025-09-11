import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({
    pattern: [
      '**/*.md',      // Include all markdown files
      '!CLAUDE.md',   // Exclude documentation files
      '!README.md',   // Exclude README
      // Future exclusions:
      // '!draft/**',     // Exclude draft directory
      // '!scratchpad/**' // Exclude scratchpad directory
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