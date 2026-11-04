"""Shared helpers for the landmass maps: the ink field (round 7 recipe), the shader's measured ink -> dot coverage,
heights, the height spread, and a calibrated halftone preview."""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

W, H = 420, 300
HERE = os.path.dirname(os.path.abspath(__file__))
CAL = np.array(json.load(open(os.path.join(HERE, 'calib.json'))))
BINS = [(0.15, 0.4, 'low'), (0.4, 0.6, 'mid-low'), (0.6, 0.8, 'mid-high'), (0.8, 0.9, 'high'), (0.9, 1.01, 'max')]


def ink(patches, w=W, h=H):
    u = (np.arange(w) + 0.5) / w
    v = (np.arange(h) + 0.5) / h
    U, V = np.meshgrid(u, v)
    s = np.zeros_like(U)
    for p in patches:
        if len(p) == 3:
            x, y, m = p
            r, wt = min(0.12, 0.035 + 0.018 * m ** 0.5), 1.0
        else:
            x, y, r, wt = p
        s += wt * np.exp(-((U - x) ** 2 + (V - y) ** 2) / (2 * r * r))
    return 0.62 * (1 - np.exp(-1.3 * np.maximum(0, s)))


def height(field):
    """Dot radius relative to the largest the shader prints, from its measured coverage."""
    cov = np.interp(field, CAL[:, 0], CAL[:, 1])
    return np.sqrt(cov / CAL[-1, 1])


def spread(patches):
    h = height(ink(patches))
    land = h >= 0.15
    n = land.sum()
    return {name: round(100 * ((h >= a) & (h < b)).sum() / n) for a, b, name in BINS}, int(n)


def preview(patches, pins=(), pitch=7.8 * 300 / 386, scale=2):
    h = height(ink(patches))
    img = Image.new('RGB', (W * scale, H * scale), 'white')
    d = ImageDraw.Draw(img)
    rmax = pitch / 2 * 0.98
    rh = pitch * 3 ** 0.5 / 2
    j, y = 0, pitch / 2
    while y < H:
        x = pitch / 2 + (j % 2) * pitch / 2
        while x < W:
            r = rmax * h[min(H - 1, int(y)), min(W - 1, int(x))]
            if r > 0.3:
                d.ellipse([(x - r) * scale, (y - r) * scale, (x + r) * scale, (y + r) * scale], fill=(154, 153, 145))
            x += pitch
        y += rh
        j += 1
    for px, py in pins:
        d.ellipse([(px * W - 4.5) * scale, (py * H - 4.5) * scale, (px * W + 4.5) * scale, (py * H + 4.5) * scale], fill=(182, 75, 0))
    return img


def sheet(items, out, cols=2):
    """items: [(title, patches, pins)] -> one image with a caption per tile, including the height spread."""
    tiles = []
    for title, patches, pins in items:
        t = preview(patches, pins)
        sp, _ = spread(patches)
        cap = Image.new('RGB', (t.width, 40), 'white')
        dc = ImageDraw.Draw(cap)
        dc.text((8, 4), title, fill=(0, 0, 0))
        dc.text((8, 20), '  '.join(f'{k} {v}%' for k, v in sp.items()), fill=(100, 100, 100))
        tile = Image.new('RGB', (t.width, t.height + 40), 'white')
        tile.paste(cap, (0, 0)); tile.paste(t, (0, 40))
        tiles.append(tile)
    rows = (len(tiles) + cols - 1) // cols
    tw, th = tiles[0].size
    out_img = Image.new('RGB', (cols * tw + (cols - 1) * 24, rows * th + (rows - 1) * 24), 'white')
    for i, t in enumerate(tiles):
        out_img.paste(t, ((i % cols) * (tw + 24), (i // cols) * (th + 24)))
    out_img.save(out)
    return out
