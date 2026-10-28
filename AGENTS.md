# meaningfool.net

Josselin Perrus's personal site: an Astro 7 static site deployed to GitHub Pages at https://meaningfool.net. DNS is on Cloudflare, without the Cloudflare proxy.

## Layout

- `src/`: pages, layouts and components.
- `src/content/writing/`: git submodule of [meaningfool-writing](https://github.com/meaningfool/meaningfool-writing), which holds every article, activity log and image. Read its `AGENTS.md` before editing content.
- `src/content.config.ts`: the content collection, built from `articles/*.md` and `daily-logs/*.md` in the submodule.
- `docs/document-sharing.md`: how the encrypted portfolio links on `/documents/` work and how to create them.

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

- `.github/workflows/deploy.yml` deploys every push to `main`. Pull requests are built but not deployed.
- To redeploy without a change, run that workflow manually, for example `gh workflow run deploy.yml -R meaningfool/meaningfool.github.io`.

## Rules

- URLs end with a slash (`trailingSlash: 'always'`, which matches how GitHub Pages serves pages). Write internal links as `/about/` or `/articles/<slug>/`. Files such as `/rss.xml` take no slash.
- Changes a visitor can see (copy, layout, styles, which posts are listed or in what order) need the owner's approval first. Technical changes must leave the rendered site identical, so build before and after and compare the output.
- Work on a branch and open a pull request. Merging to `main` deploys.
- The repository is public. Never commit or post secrets, document keys, original PDFs or personal data. `docs/document-sharing.md` lists the files that must stay private.
- Planned work is tracked in GitHub issues.
