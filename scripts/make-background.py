"""Make the data files the page background and the topic map are drawn from, in src/assets/background/.

The prototype (docs/redesign/prototype/) computed all three in the browser and printed two of them with Paper Shaders'
Halftone Dots shader. The site does that work here instead, once, and ships the results as small images. The browser
only places the dots and draws them on a canvas (src/components/Background.astro and TopicMap.astro), with no shader
library and no WebGL.

- paper.png: a 140px tile of the paper texture, at 2x. It is the shader's output for a plain white image (hex grid,
  "gooey" dots in a colour 87% of the way from #f2f1e8 to #2b2b2b, grain 61%, 10px dot spacing), computed pixel by
  pixel as the shader does, then laid at 6% on the white page. The dots repeat every 14px; the grain is the shader's
  value noise made to wrap around the tile, so the tile repeats without a seam.
- corner.png: the ink of the corner pattern, the "Ripple" rings around the top-right corner, made with the prototype's
  recipe (three rings, each 60% as dark as the one inside it, twist 165%). It is drawn on a polar grid around the corner:
  one column per 1/4 degree, from along the top edge (left) to straight down the right edge (right), and 768 rows from
  the corner out to 1.5 times the reach (142% of the window's short side). Each pixel is how big a dot is there, as a
  share of the largest, after the prototype's blur and tone curve. The browser lays the dots on their own grid (7px
  apart, at 14 degrees) and reads each dot's size from this image.
- map.png: the topic map ("Best of three"), in the 420 x 300 box of the prototype: the image the prototype gave the
  shader, 255 x (1 - ink), with the ink made from the land's patches in src/data/topic-map.json. The browser lays grey
  dots 7.8px apart over the map's box and reads each dot's size from it, as the shader does.

Run from the repository root, with numpy and Pillow installed (pip install numpy pillow):

    python3 scripts/make-background.py

The settings below are the prototype's. The same settings give the same files.
"""
import json
import math
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "src", "assets", "background")
MAP_SPEC = os.path.join(ROOT, "src", "data", "topic-map.json")


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


def save_png(path, pixels):
    """Grey levels, or RGB colours, which are saved with a palette of exactly the colours used."""
    pixels = np.ascontiguousarray(pixels, dtype=np.uint8)
    if pixels.ndim == 2:
        image = Image.fromarray(pixels, "L")
    else:
        colours, index = np.unique(pixels.reshape(-1, 3), axis=0, return_inverse=True)
        assert len(colours) <= 256
        image = Image.fromarray(index.reshape(pixels.shape[:2]).astype(np.uint8), "P")
        image.putpalette(colours.flatten().tolist())
    image.save(path, optimize=True)
    print(os.path.relpath(path, ROOT), os.path.getsize(path), "bytes")


# Paper ---------------------------------------------------------------------------------------------------------------

PAPER = {
    "back": "#f2f1e8",  # the paper
    "ink": "#2b2b2b",
    "dots": 87,  # dot colour, % of the way from the paper to the ink
    "grain": 61,  # grain overlay, %
    "spacing": 10,  # px, the setting the prototype turns into the shader's size
    "opacity": 6,  # % the layer is shown at, over the white page
    "radius": 1.25,
    "contrast": 0.4,
    "grain_mixer": 0.2,
    "grain_size": 0.5,
}
# For gooey dots on the hex grid, the shader's cells are 6 x 0.7 of the spacing (42px), with a dot every 1/6 of a cell
# (7px) where its row and column add up to an even number: dots 9.9px apart, a pattern that repeats every 14px.
STEP = PAPER["spacing"] * 0.7
PERIOD = 2 * STEP
TILE = 140  # CSS px: ten repeats of the pattern
SCALE = 2  # device pixels per CSS px, as the shader renders at least at 2x
# The shader's grain has mix(2000, 200, grain size) = 1100 cells across the window: 1.31px on a 1440px wide one.
GRAIN_PX = 1440 / (2000 + (200 - 2000) * PAPER["grain_size"])
GRAIN_CELLS = round(TILE / GRAIN_PX)


def wrapping_noise(cells, size, seed):
    """Value noise as the shader's valueNoise(), smooth between random values on a grid of cells x cells that wraps."""
    values = np.random.default_rng(seed).random((cells, cells))
    p = (np.arange(size) + 0.5) / size * cells
    i = np.floor(p).astype(int)
    f = p - i
    f = f * f * (3 - 2 * f)
    i0, i1 = i % cells, (i + 1) % cells
    a = values[np.ix_(i0, i0)]
    b = values[np.ix_(i0, i1)]
    c = values[np.ix_(i1, i0)]
    d = values[np.ix_(i1, i1)]
    fx, fy = f[None, :], f[:, None]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def paper_tile():
    """The Halftone Dots shader (gooey dots, hex grid) on a plain white image, as in the shader's source."""
    size = TILE * SCALE
    xy = (np.arange(size) + 0.5) / SCALE  # CSS px
    x, y = np.meshgrid(xy, xy)
    # Distance to the nearest dot: dots at (STEP i, STEP j) with i + j even.
    dist = np.full(x.shape, np.inf)
    for ox, oy in ((0, 0), (PERIOD, 0), (0, PERIOD), (PERIOD, PERIOD), (STEP, STEP)):
        dist = np.minimum(dist, np.hypot(np.mod(x, PERIOD) - ox, np.mod(y, PERIOD) - oy))
    contrast = 15 * PAPER["contrast"] ** 1.5
    lum = 1 / (1 + math.exp(-contrast * (1 - 0.5)))  # white, through the shader's sigmoid
    size_radius = 0.42 * PAPER["radius"] * (1 - lum)  # in cells
    d = dist / (6 * STEP)  # in cells
    shape = (1 - smoothstep(0, size_radius, d)) ** (2 + PAPER["radius"])
    gy, gx = np.gradient(shape)
    aa = np.maximum(np.abs(gx) + np.abs(gy), 1e-9)  # the shader's fwidth()
    shape = smoothstep(0.5 - aa, 0.5 + aa, shape)

    grain = smoothstep(0.55, 0.7 + 0.2 * PAPER["grain_mixer"], wrapping_noise(GRAIN_CELLS, size, 1))
    shape = shape * (1 - grain * PAPER["grain_mixer"])

    back = hex_rgb(PAPER["back"]) / 255
    ink = hex_rgb(PAPER["ink"])
    front = np.round(hex_rgb(PAPER["back"]) + (ink - hex_rgb(PAPER["back"])) * PAPER["dots"] / 100) / 255
    color = front * shape[..., None] + back * (1 - shape[..., None])

    overlay = 0.5 * (wrapping_noise(GRAIN_CELLS, size, 2) + wrapping_noise(GRAIN_CELLS, size, 3))
    v = overlay ** 1.3 * 2 - 1
    strength = 0.5 * (PAPER["grain"] / 100 * np.abs(v)) ** 0.8
    target = (v >= 0).astype(float)[..., None]
    color = color + (target - color) * strength[..., None]

    alpha = PAPER["opacity"] / 100
    page = 1 - alpha + alpha * color  # over white
    return np.round(np.clip(page, 0, 1) * 255)


# Corner pattern ------------------------------------------------------------------------------------------------------

# The dot spacing and the reach are also in Background.astro, which lays the dots out (with the grid at 14 degrees).
CORNER = {"spacing": 7, "reach": 142, "rings": 3, "fade": 60, "twist": 165}
# The prototype's darkness response (line density, blur in dot spacings, tone curve) and its pixel grid, 1/4 of the dot
# spacing.
FIT = {
    "dens": 0.1407, "gain": 0.784, "gamma": 0.7615, "blur": 0.22,
    "tone": [[0, 0], [0.203, 0.179], [0.225, 0.195], [0.257, 0.223], [0.295, 0.285], [0.331, 0.33], [0.381, 0.413],
             [0.427, 0.44], [0.451, 0.46], [0.468, 0.483], [0.49, 0.507], [0.519, 0.542], [0.554, 0.59], [0.6, 0.646],
             [0.649, 0.712], [0.717, 0.841], [0.763, 0.956], [1, 1]],
}
CELL = CORNER["spacing"] / 4
# Corner rings, inner first: each ring's five curves give the distance from the corner (in reach units) at nine angles,
# from along the top edge (first) to straight down the right edge (last).
RIPPLE = [
    [[0.204, 0.197, 0.189, 0.185, 0.186, 0.195, 0.208, 0.224, 0.238], [0.156, 0.201, 0.285, 0.368, 0.411, 0.394, 0.325, 0.236, 0.17],
     [0.495, 0.582, 0.617, 0.583, 0.496, 0.394, 0.321, 0.311, 0.37], [0.463, 0.413, 0.369, 0.34, 0.33, 0.342, 0.373, 0.419, 0.471],
     [0.483, 0.465, 0.448, 0.439, 0.441, 0.453, 0.471, 0.486, 0.494]],
    [[0.442, 0.458, 0.485, 0.516, 0.541, 0.555, 0.555, 0.542, 0.522], [0.713, 0.716, 0.714, 0.699, 0.668, 0.618, 0.552, 0.476, 0.401],
     [0.664, 0.68, 0.689, 0.685, 0.663, 0.624, 0.57, 0.51, 0.457], [0.475, 0.416, 0.365, 0.328, 0.31, 0.313, 0.336, 0.374, 0.422],
     [0.77, 0.775, 0.787, 0.802, 0.814, 0.818, 0.813, 0.801, 0.787]],
    [[0.8, 0.804, 0.82, 0.843, 0.863, 0.874, 0.869, 0.849, 0.822], [0.622, 0.751, 0.898, 1.033, 1.129, 1.168, 1.147, 1.072, 0.96],
     [0.968, 1.061, 1.188, 1.306, 1.376, 1.377, 1.308, 1.192, 1.067], [1.407, 1.413, 1.397, 1.354, 1.286, 1.202, 1.113, 1.034, 0.979],
     [1.068, 1.097, 1.121, 1.131, 1.124, 1.101, 1.071, 1.043, 1.027]],
]
ANGLES = 360  # columns, half the prototype's polar grid: finer gives the same dots
ROWS = 768  # rows, from the corner out to RMAX: 2.5px each on a 1440 x 900 window
RMAX = 1.5  # reach units: the outer ring ends at 1.43 (Background.astro's ROWS_REACH)
REACH_PX = 900 * CORNER["reach"] / 100  # the reach on a 1440 x 900 window, where the blur is measured
SAMPLES = 1200  # points along each line of a bundle


def twisted(curves, pct):
    """Twist scales how far the inner curves swing from the edges' midline."""
    c = np.array(curves, dtype=float)
    mid = (c[0] + c[-1]) / 2
    out = mid + (c - mid) * pct / 100
    out[0], out[-1] = c[0], c[-1]
    return out


def catmull_rom(vs, u):
    """Smooth curve through values at evenly spaced points (Catmull-Rom, clamped ends), as the prototype's curve()."""
    n = len(vs) - 1
    i = np.clip(np.floor(u * n).astype(int), 0, n - 1)
    t = np.clip(u * n - i, 0, 1)
    p0, p1, p2, p3 = vs[np.maximum(i - 1, 0)], vs[i], vs[i + 1], vs[np.minimum(i + 2, n)]
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def tone(d):
    t = np.array(FIT["tone"])
    return np.interp(d, t[:, 0], t[:, 1])


def corner_field():
    """The prototype's cornerInk() and blur, on a polar grid in reach units instead of the window's pixels."""
    row = RMAX / ROWS  # reach units per row
    u = (np.arange(ANGLES) + 0.5) / ANGLES
    s = (np.arange(SAMPLES) + 0.5) / SAMPLES
    bern = np.stack([math.comb(4, k) * s ** k * (1 - s) ** (4 - k) for k in range(5)], axis=1)  # SAMPLES x 5
    polar = np.zeros((ROWS + 1, ANGLES))
    cols = np.broadcast_to(np.arange(ANGLES), (SAMPLES, ANGLES))
    for j, ring in enumerate(RIPPLE[:CORNER["rings"]]):
        cv = np.stack([catmull_rom(c, u) for c in twisted(ring, CORNER["twist"])])  # 5 x ANGLES
        y = bern @ cv  # SAMPLES x ANGLES: each line of the bundle, in reach units
        share = FIT["dens"] * (CORNER["fade"] / 100) ** j / SAMPLES / row
        fy = y / row - 0.5
        i0 = np.floor(fy).astype(int)
        t = fy - i0
        for rows, weight in ((i0, 1 - t), (i0 + 1, t)):
            ok = (rows >= 0) & (rows <= ROWS)
            np.add.at(polar, (rows[ok], cols[ok]), weight[ok] * share)
    ink = 1 - np.exp(-polar[:ROWS])

    # The prototype blurs the ink on the window's grid, by 0.88 of a 1.75px cell. Do the same here around each point of
    # the polar grid, for the reach of a 1440 x 900 window: along the radius, then along each arc.
    sigma_px = FIT["blur"] * 4 * CELL
    ink = blur_rows(ink.T, sigma_px / (row * REACH_PX)).T
    radius = (np.arange(ROWS) + 0.5) * row * REACH_PX  # px from the corner
    per_col = (math.pi / 2) / ANGLES * np.maximum(radius, 1)  # px along the arc per column
    for r in range(ROWS):
        ink[r] = blur_rows(ink[r][None, :], min(40, sigma_px / per_col[r]))[0]

    dark = tone(np.minimum(1, FIT["gain"] * ink) ** FIT["gamma"])
    assert dark[-8:].max() == 0, "the outer ring reaches past RMAX"
    return np.round(dark * 255)


def blur_rows(a, sigma):
    """Gaussian blur along the last axis, with nothing beyond the ends (as the prototype's blur1d)."""
    if sigma < 0.05:
        return a
    r = int(math.ceil(3 * sigma))
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma * sigma))
    k /= k.sum()
    return np.stack([np.convolve(line, k, mode="same") for line in a])


# Topic map -----------------------------------------------------------------------------------------------------------


def map_image():
    """The prototype's source(): ink where the patches gather. (Its mask of where there is ink at all, which also fades
    the land over the outer 4% of the box, is computed from this image in the browser.)"""
    spec = json.load(open(MAP_SPEC))
    w, h = spec["box"]
    k = spec["fit"]["scale"]
    cx, cy = spec["fit"]["centre"]
    # "Best of three" runs past the right edge of the box, so it is drawn 7% smaller about the centre of its land.
    patches = [(0.5 + (x - cx) * k, 0.5 + (y - cy) * k, r * k, wt) for x, y, r, wt in spec["patches"]]
    u, v = np.meshgrid(np.arange(w) / w, np.arange(h) / h)
    s = np.zeros_like(u)
    for x, y, r, wt in patches:
        s += wt * np.exp(-((u - x) ** 2 + (v - y) ** 2) / (2 * r * r))
    ink = 0.62 * (1 - np.exp(-1.3 * np.maximum(0, s)))
    return np.round(255 * (1 - ink))


def main():
    os.makedirs(OUT, exist_ok=True)
    save_png(os.path.join(OUT, "paper.png"), paper_tile())
    save_png(os.path.join(OUT, "corner.png"), corner_field())
    save_png(os.path.join(OUT, "map.png"), map_image())


if __name__ == "__main__":
    main()
