// @ts-check
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import remarkDropTitle from './src/lib/remark-drop-title.mjs';
import remarkHeadingLevels from './src/lib/remark-heading-levels.mjs';
import rehypeArticle from './src/lib/rehype-article.mjs';
import trailingSlashRedirects from './src/lib/trailing-slash-redirects.mjs';
import { postLastModified } from './src/lib/posts.mjs';

const lastModified = postLastModified(fileURLToPath(new URL('./src/content/writing', import.meta.url)));

// Astro keeps each post's rendered HTML between builds, in node_modules/.astro, which the deploy workflow restores from
// its cache, and renders a post again only when the post or this config changes. The Markdown plugins' code and the
// installed packages aren't part of the config it compares, so a hash of them is, as rehypeArticle's options.
const markdownSources = ['src/lib/remark-drop-title.mjs', 'src/lib/remark-heading-levels.mjs', 'src/lib/rehype-article.mjs', 'bun.lock'];
const markdownDigest = createHash('sha256')
    .update(markdownSources.map((file) => readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')).join('\0'))
    .digest('hex');

// https://astro.build/config
export default defineConfig({
    markdown: {
        processor: unified({
            remarkPlugins: [remarkBreaks, remarkDropTitle, remarkHeadingLevels],
            // rehype-raw first, so that rehypeArticle also sees the HTML written in the Markdown, such as embeds
            rehypePlugins: [rehypeRaw, [rehypeArticle, { markdownDigest }]],
        }),
        shikiConfig: { theme: 'github-light' }, // code blocks sit on the white page, in a light frame (prose.css)
    },
    integrations: [sitemap({
        filter: (page) => !/^\/documents\/?$/.test(new URL(page).pathname),
        serialize: (item) => ({ ...item, lastmod: lastModified.get(new URL(item.url).pathname) }),
    }), trailingSlashRedirects()],
    site: 'https://meaningfool.net',
    base: '/',
    output: 'static',
    compressHTML: true, // Astro 7 defaults to 'jsx', which drops whitespace between inline elements
    trailingSlash: 'always', // Pages live at /page/; dist/_redirects sends /page there with a 301
    prefetch: false, // Home and About's ClientRouter (IntroRouter.astro) would otherwise prefetch every link hovered
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
