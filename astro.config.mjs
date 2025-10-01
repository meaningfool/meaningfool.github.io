// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
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
