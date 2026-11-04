# Paper designs

Exports from the redesign's Paper file, for the issues that a cloud session can't open Paper for. The fonts in these images are Menlo; the site uses DejaVu Sans Mono instead (#29).

Colours, as named in the Paper file: paper `#ffffff`, ink `#151515`, muted `#686862`, line `#e5e5e2`, panel `#f3f3f0`, tint `#fff9f4`, accent `#b64b00`.

## Share images (#34)

`share-article.png` and `share-home-about.png`, 1200×630.

Both have the same frame: white, padding 64px top, 72px sides, 56px bottom, three rows spread from top to bottom.

- **Top row.** Left: the wordmark "meaningfool." in mono 36px/36px, tracking -0.055em, the dot in the accent colour. Right: a label tab, mono 20px/28px ink text on the tint colour, padding 10px 20px 9px, with a 3px accent line under it.
- **Middle.**
  - Article: the title in mono 68px/80px, tracking -0.05em, ink, at most 1020px wide.
  - Home and About: "Josselin Perrus" in mono 84px/92px, tracking -0.05em; 20px below it, a line in mono 28px/42px, tracking -0.02em, muted, at most 920px wide.
- **Bottom row.** A 2px line on top, then 24px of space, then mono 22px/30px: ink text on the left, muted text on the right.
  - Article: "Josselin Perrus" on the left, "<date> · <n> min read" on the right (for example "May 27, 2026 · 3 min read").
  - Home and About: "meaningfool.net" on the left, "<n> articles · <n> projects" on the right, counted at build time.
- **Label tab.** "Article" on articles.

The Home and About image was drawn before the intro copy and the navigation changed. Its text, updated to match:

- Label tab: "Projects · Writing" (what the home holds; it said "Writing · Projects").
- Line under the name: the home intro, "I'm a product manager building AI products with AI. My projects are an opportunity to test ideas and learn in public." (it said "Product manager in Paris. I write about product work and about building software with AI agents.")

Generate one image per article at build time, and one for Home and About.

## Favicon (#34)

`favicon-options@2x.png` shows the three options that were compared; option 2, the paper tile, was chosen. `favicon-paper-tile@4x.png` is the chosen tile at 576×576 (its 144px version at 4×).

The tile, at each size:

| Tile | Background | Border | "m" size | Space under the glyphs |
|---|---|---|---|---|
| 144px | panel `#f3f3f0` | 1px `#dcdcd6` | 108px | 14px |
| 64px | panel | 1px `#dcdcd6` | 48px | 6px |
| 32px | panel | 1px `#dcdcd6` | 24px | 3px |
| 16px | panel | 1px `#dcdcd6` | 12px | 1px |

The glyphs are "m." in mono, line height equal to the font size, tracking -0.12em, centred in the tile. The "m" is ink, the "." is the accent colour (`#b64b00`), so it reads as a small orange square. Ship an SVG icon (glyphs converted to paths, so it doesn't depend on fonts), a `favicon.ico` with 16px and 32px, and a 180px `apple-touch-icon`.

## Article page (#32)

`article-v2.png` is the chosen article design, "V2 · Article — Serif text", at 1440px wide. Issue #32 gives its exact values; the site widens the column from 680px to 720px.
