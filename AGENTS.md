# meaningfool.net

Josselin Perrus's personal site: an Astro 7 static site served by Cloudflare Workers at https://meaningfool.net. DNS is on Cloudflare too.

## Layout

- `src/`: pages, layouts and components. Pages are built in the `Frame` component, which holds the header and the footer; the portfolio view of `/documents/` has its own.
- `src/styles/`: `tokens.css` holds the colours and fonts as custom properties, and `global.css` the base styles.
- `src/fonts/`: the self-hosted fonts, DejaVu Sans Mono and Newsreader, subset by `scripts/subset-fonts.py`, with their licences. The site loads no outside fonts.
- The page background (`src/components/Background.astro`: the paper texture and the corner pattern) and the topic map (`TopicMap.astro`, inside the `Intro` of Home and About) are drawn on canvases from small images in `src/assets/background/`. `scripts/make-background.py` makes those images, from the map's land in `src/data/topic-map.json`; rerun it after changing either, and commit its output. The site loads no shader library.
- `src/content/writing/`: git submodule of [meaningfool-writing](https://github.com/meaningfool/meaningfool-writing), which holds every article, activity log and image. Read its `AGENTS.md` before editing content.
- `src/content.config.ts`: the content collection, built from `articles/*.md` and `daily-logs/*.md` in the submodule.
- `src/pages/index.astro`: the home. Its Writing list holds the articles, not the activity logs, and picking a topic on the map shows only the articles about it. An article's topics are its `topics` frontmatter field (`customer-success`, `product`, `ai-agents`: each one that makes up 30% or more of it).
- `src/pages/articles/[slug].astro`: the page of every article and activity log. The Markdown goes through the plugins in `src/lib/` set in `astro.config.mjs`: the `# Title` line is dropped, the headings are renumbered from h2, and `rehype-article.mjs` shapes figures, YouTube embeds (moved to youtube-nocookie.com) and tables for `src/styles/prose.css`. In a table, a row whose cells are all bold is highlighted, and a paragraph starting with `Table:` right after it, past a blank line, is its caption. An image alone in its paragraph is captioned with its title, or with its alt text when that has a space.
- `src/data/projects.ts`: the projects, with their screenshots in `src/assets/projects/`, and which articles belong to each, by article id.
- `docs/document-sharing.md`: how the encrypted portfolio links on `/documents/` work and how to create them.
- `wrangler.jsonc`: the Cloudflare Worker `meaningfool`, which serves `dist/` as static assets.
- `worker/index.js`: the only Worker code. It answers byte-range requests for the videos in `/images/`, which Safari needs to play them.
- `public/_headers`: headers Cloudflare adds to responses: security headers, a year of caching for the fingerprinted `/_astro/*` files, and a Content-Security-Policy in report-only mode. A new kind of outside resource, such as another video host's embed or a third-party script, must be added to that policy. The build also writes `dist/_redirects`, the permanent `/page` → `/page/` redirects, with `src/lib/trailing-slash-redirects.mjs`.

## Commands

Node 24 (`.nvmrc`) and Bun 1.4.4.

- `bun install`
- `git submodule update --init --remote`: fetch the latest content
- `bun dev`: local server at http://localhost:4321
- `bun run build`: production build in `dist/`
- `bun run test:documents`: tests for the document-sharing code

## Content changes

Commit and push content in the submodule's own repository, meaningfool-writing, never in this one. A push of published content there deploys the site. This repository's submodule pointer doesn't need updating, because every deploy builds the latest content.

## Deploys

- `.github/workflows/deploy.yml` builds every push to `main` and deploys it with `wrangler deploy`.
- Pull requests get a preview instead: `wrangler versions upload` publishes the build at `https://pr-<number>-meaningfool.josselin-perrus.workers.dev` without touching production, and a bot comment on the PR links it. Previews send `X-Robots-Tag: noindex`. Dependabot and fork pull requests don't get the Cloudflare secrets, so they only run `wrangler deploy --dry-run`.
- To redeploy without a change, run that workflow manually, for example `gh workflow run deploy.yml -R meaningfool/meaningfool.github.io`.
- The latest deploy is also served at https://meaningfool.josselin-perrus.workers.dev.
- Cloudflare serves files of up to 25 MiB; a bigger file makes the deploy fail.
- Set in the Cloudflare dashboard, not in this repository: the Worker's custom domain `meaningfool.net` (deploys keep it), the `www` → `meaningfool.net` Redirect Rule, and Always Use HTTPS.

## Analytics

Cloudflare Web Analytics adds its beacon to every page automatically, so the code has no snippet. `/documents/` sends `Cache-Control: no-transform` (`public/_headers`), so Cloudflare adds none there: its links carry a private access token.

## Rules

- URLs end with a slash (`trailingSlash: 'always'`), and `/page` redirects permanently to `/page/`. Write internal links as `/about/` or `/articles/<slug>/`. Files such as `/rss.xml` take no slash.
- Changes a visitor can see (copy, layout, styles, which posts are listed or in what order) need the owner's approval first. Technical changes must leave the rendered site identical, so build before and after and compare the output.
- Work on a branch and open a pull request. Merging to `main` deploys.
- The repository is public. Never commit or post secrets, document keys, original PDFs or personal data. `docs/document-sharing.md` lists the files that must stay private.
- Planned work is tracked in GitHub issues.
