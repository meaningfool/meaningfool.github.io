# Redesign reference

The prototype approved in #8, kept as the reference for building the redesign (#35 and its sub-issues). Nothing here is part of the site build.

## View it

Open `prototype/index.html` in a browser, or serve the folder:

```
python3 -m http.server -d docs/redesign/prototype
```

The prototype has three pages: the home, `#article` and `#about`. After editing `template.html` or `maps.js`, rebuild `index.html`:

```
python3 docs/redesign/prototype/build.py
```

## What's where

- `prototype/template.html`: the layout, styles and copy of the three pages. Its script draws the paper background (Paper Shaders), the corner pattern (a canvas) and the mask that clears the pattern around the map. The settled values are at the top of the script.
- `prototype/maps.js`: the 18 articles with their topic weights (customer success, product, AI agents), the map shapes, labels and orange dots, and the print settings. The chosen map is `best`, placed by `fit()`.
- `prototype/images/`: the project screenshots and the article figure.
- `map-tools/`: how the map was made. `gen.py` builds island maps from specs; `specs-2.json` holds the recipe for `best`. `lib.py` computes the ink field and a halftone preview calibrated against the shader: `calib.json` (ink to dot coverage) was measured with `calib.html`. Useful for #30, which has to draw the dots without the shader. Needs numpy and Pillow.

## Where the site differs from the prototype

- The prototype loads `@paper-design/shaders` from jsDelivr and computes the background and the map in the browser. The site prepares them at build time (#30).
- The prototype uses Menlo and loads Newsreader from Google Fonts. The site self-hosts DejaVu Sans Mono and Newsreader (#29).
