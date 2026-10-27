// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkBreaks from 'remark-breaks';

// https://astro.build/config
export default defineConfig({
    markdown: {
        remarkPlugins: [remarkBreaks],
    },
    integrations: [sitemap({
        filter: (page) => !/^\/documents\/?$/.test(new URL(page).pathname),
    })],
    site: 'https://meaningfool.net',
    base: '/',
    output: 'static',
    trailingSlash: 'always', // Matches GitHub Pages, which redirects /page to /page/
    vite: {
        resolve: {
            preserveSymlinks: true
        }
    }
});
