// Cloudflare Workers answers /page with a temporary (307) redirect to /page/.
// Search engines treat that as a weak signal, so list every page in dist/_redirects
// with a permanent (301) redirect instead.
import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Astro integration that writes `/page /page/ 301` for every `page/index.html` in the build. */
export default function trailingSlashRedirects() {
  return {
    name: 'trailing-slash-redirects',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const pages = (await readdir(root, { recursive: true }))
          .filter((file) => file.endsWith(`${sep}index.html`))
          .map((file) => `/${dirname(file).split(sep).join('/')}`)
          .sort();
        await writeFile(join(root, '_redirects'), pages.map((page) => `${page} ${page}/ 301\n`).join(''));
      },
    },
  };
}
