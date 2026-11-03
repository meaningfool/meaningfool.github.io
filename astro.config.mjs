// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import remarkDropTitle from './src/lib/remark-drop-title.mjs';
import trailingSlashRedirects from './src/lib/trailing-slash-redirects.mjs';
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
        // TEMPORARY (#30): /map-preview/ shows the intro and the map until the home uses them; #31 deletes it.
        filter: (page) => !/^\/(documents|map-preview)\/?$/.test(new URL(page).pathname),
        serialize: (item) => ({ ...item, lastmod: lastModified.get(new URL(item.url).pathname) }),
    }), trailingSlashRedirects()],
    site: 'https://meaningfool.net',
    base: '/',
    output: 'static',
    compressHTML: true, // Astro 7 defaults to 'jsx', which drops whitespace between inline elements
    trailingSlash: 'always', // Pages live at /page/; dist/_redirects sends /page there with a 301
    vite: {
        resolve: {
            preserveSymlinks: true
        },
        build: {
            // Scripts stay in their own files, never inline: the Content-Security-Policy (public/_headers) only allows
            // scripts from the site. Other assets keep Vite's default, inline under 4 KB.
            assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined)
        }
    }
});
