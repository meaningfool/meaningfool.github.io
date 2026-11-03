// @ts-check
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

// https://astro.build/config
export default defineConfig({
    markdown: {
        processor: unified({
            remarkPlugins: [remarkBreaks, remarkDropTitle, remarkHeadingLevels],
            // rehype-raw first, so that rehypeArticle also sees the HTML written in the Markdown, such as embeds
            rehypePlugins: [rehypeRaw, rehypeArticle],
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
    vite: {
        resolve: {
            preserveSymlinks: true
        }
    }
});
