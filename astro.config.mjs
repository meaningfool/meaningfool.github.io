// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import remarkDropTitle from './src/lib/remark-drop-title.mjs';
import { postLastModified } from './src/lib/posts.mjs';

const lastModified = postLastModified(fileURLToPath(new URL('./src/content/writing', import.meta.url)));

// https://astro.build/config
export default defineConfig({
    markdown: {
        processor: unified({
            remarkPlugins: [remarkBreaks, remarkDropTitle],
        }),
    },
    integrations: [sitemap({
        filter: (page) => !/^\/documents\/?$/.test(new URL(page).pathname),
        serialize: (item) => ({ ...item, lastmod: lastModified.get(new URL(item.url).pathname) }),
    })],
    site: 'https://meaningfool.net',
    base: '/',
    output: 'static',
    compressHTML: true, // Astro 7 defaults to 'jsx', which drops whitespace between inline elements
    trailingSlash: 'always', // Matches GitHub Pages, which redirects /page to /page/
    vite: {
        resolve: {
            preserveSymlinks: true
        }
    }
});
