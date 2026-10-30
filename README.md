# meaningfool.net

Source of [meaningfool.net](https://meaningfool.net), Josselin Perrus's personal site, with writing about product and AI-assisted programming.

It is an [Astro](https://astro.build) static site served by [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/). The articles live in a separate repository, [meaningfool-writing](https://github.com/meaningfool/meaningfool-writing), included here as a git submodule at `src/content/writing/`.

## Run it locally

Requires Node 24 and Bun.

```sh
git clone --recurse-submodules https://github.com/meaningfool/meaningfool.github.io
cd meaningfool.github.io
git submodule update --remote   # fetch the latest content
bun install
bun dev                         # http://localhost:4321
```

`bun run build` writes the production site to `dist/`, and `bun run test:documents` runs the tests for the document-sharing code.

## Publishing

- **Code:** merging a pull request into `main` deploys the site.
- **Content:** pushing published content to meaningfool-writing's `main` deploys it too. Every deploy builds the latest content.

[`AGENTS.md`](AGENTS.md) holds the working notes for coding agents, and [`docs/document-sharing.md`](docs/document-sharing.md) explains the encrypted portfolio links.
