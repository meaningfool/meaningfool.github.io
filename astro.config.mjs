// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkBreaks from 'remark-breaks';

// https://astro.build/config
export default defineConfig({
    markdown: {
        remarkPlugins: [remarkBreaks],
    },
    integrations: [sitemap()],
    site: 'https://meaningfool.net',
    base: '/',
    output: 'static',
    trailingSlash: 'never', // Consistent URL format
    vite: {
        resolve: {
            preserveSymlinks: true
        }
    }
});
