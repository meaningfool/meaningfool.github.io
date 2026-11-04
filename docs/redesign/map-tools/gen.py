"""Three-island maps from a few parameters, so variations differ on purpose and none is symmetrical.

An island is a low, irregular footprint (a few broad lobes, a bay cut into one coast) with 2-4 hills on it; the
hill under the topic's dot is the island's top. Links are chains of patches whose height rises and falls along
the way. Patches are [x, y, radius, weight] in the 420 x 300 box. Heights are tuned against the shader's
measured dot sizes (lib.height), aiming for round 7's spread: little land at the very top, most of it in between.
"""
import json
import math
import random
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
from lib import sheet, spread  # noqa: E402


def island(rnd, c, size, top, hills, bay, body=0.85, lobes=3):
    """c: the dot. body: weight of the island's footprint (its mid heights). top: extra weight at the dot's hill.
    hills: [(dx, dy, r, w)] relative to c. bay: (angle deg, depth)."""
    x0, y0 = c
    out = [[x0, y0, size, body]]
    for _ in range(lobes):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(0.4, 0.8) * size
        out.append([x0 + math.cos(a) * d * 1.2, y0 + math.sin(a) * d, size * rnd.uniform(0.5, 0.75), body * rnd.uniform(0.4, 0.6)])
    out.append([x0 + rnd.uniform(-0.01, 0.01), y0 + rnd.uniform(-0.01, 0.01), 0.04, top])
    # Each variation nudges the hills a little, so no two islands repeat each other.
    for dx, dy, r, w in hills:
        out.append([x0 + dx + rnd.uniform(-0.015, 0.015), y0 + dy + rnd.uniform(-0.015, 0.015), r * rnd.uniform(0.85, 1.15), w * rnd.uniform(0.85, 1.15)])
    if bay:
        a, depth = bay
        out.append([x0 + math.cos(math.radians(a)) * size * 1.25, y0 + math.sin(math.radians(a)) * size * 0.95, size * 0.45, -depth])
    return out


def chain(rnd, p0, p1, n, r, weights, bow=0.0, jitter=0.012):
    """Patches along a line from p0 to p1, bowed sideways by `bow` (positive bends to the right of travel)."""
    out = []
    (x0, y0), (x1, y1) = p0, p1
    nx, ny = (y1 - y0), -(x1 - x0)
    ln = math.hypot(nx, ny) or 1
    for i in range(n):
        t = (i + 0.5) / n
        b = bow * math.sin(math.pi * t)
        x = x0 + (x1 - x0) * t + nx / ln * b + rnd.uniform(-jitter, jitter)
        y = y0 + (y1 - y0) * t + ny / ln * b + rnd.uniform(-jitter, jitter)
        w = weights[min(len(weights) - 1, int(t * len(weights)))]
        out.append([x, y, r * rnd.uniform(0.8, 1.2), w * rnd.uniform(0.85, 1.15)])
    return out


def rocks(rnd, p0, p1, n, bow=0.0, spread_=0.02, big=0.25):
    out = []
    for i in range(n):
        t = rnd.uniform(0.05, 0.95)
        (x0, y0), (x1, y1) = p0, p1
        nx, ny = (y1 - y0), -(x1 - x0)
        ln = math.hypot(nx, ny) or 1
        b = bow * math.sin(math.pi * t)
        x = x0 + (x1 - x0) * t + nx / ln * b + rnd.uniform(-spread_, spread_)
        y = y0 + (y1 - y0) * t + ny / ln * b + rnd.uniform(-spread_, spread_)
        isbig = rnd.random() < big
        out.append([x, y, rnd.uniform(0.016, 0.024) if isbig else rnd.uniform(0.009, 0.014), rnd.uniform(1.0, 1.4) if isbig else rnd.uniform(0.6, 0.9)])
    return out


def build(v):
    """The map as one patch list (see parts() for the same patches grouped by what they draw)."""
    return [p for g in parts(v).values() for p in g]


def parts(v):
    """Patches grouped: cs, product, agents (islands), left, right, top (links), extra (hand-placed), islets.
    Grouping doesn't change the random sequence, so the same spec always gives the same patches."""
    rnd = random.Random(v['seed'])
    cs, pr, ag = v['cs'], v['product'], v['agents']
    G = {}
    G['cs'] = island(rnd, cs, v.get('cs_size', 0.12), v.get('cs_top', 0.45), v['cs_hills'], v.get('cs_bay', (200, 0.8)), body=v.get('cs_body', 0.72))
    G['product'] = island(rnd, pr, v.get('pr_size', 0.11), v.get('pr_top', 0.65), v['pr_hills'], v.get('pr_bay'), body=v.get('pr_body', 0.82))
    G['agents'] = island(rnd, ag, v.get('ag_size', 0.13), v.get('ag_top', 0.85), v['ag_hills'], v.get('ag_bay'), body=v.get('ag_body', 0.92))
    # Customer success to Product: substantial, with a dip and its own hill
    G['left'] = chain(rnd, (cs[0] + 0.01, cs[1] + 0.1), (pr[0] - 0.12, pr[1] - 0.08), 6, 0.04, v.get('left_w', [0.7, 0.5, 0.9, 0.6, 0.7]), bow=v.get('left_bow', -0.02))
    # Product to AI agents: merged, a saddle between rises
    G['right'] = chain(rnd, (pr[0] + 0.1, pr[1] - 0.05), (ag[0] - 0.09, ag[1] + 0.11), 5, 0.036, v.get('right_w', [0.65, 0.35, 0.6]), bow=v.get('right_bow', 0.02))
    # Customer success to AI agents: shallow; its path is what the variations play with
    G['top'], G['extra'] = [], []
    for seg in v['top']:
        kind = seg[0]
        if kind == 'shelf':
            _, p0, p1, n, w, bow = seg
            G['top'] += chain(rnd, p0, p1, n, 0.034, [w], bow=bow, jitter=0.015)
        elif kind == 'rocks':
            _, p0, p1, n, bow = seg
            G['top'] += rocks(rnd, p0, p1, n, bow=bow)
        elif kind == 'patch':
            G['extra'].append(list(seg[1]))
    G['islets'] = [[x, y, rnd.uniform(0.016, 0.022), rnd.uniform(0.7, 1.0)] for x, y in v.get('islets', [])]
    return {k: [[round(a, 4) for a in p] for p in g] for k, g in G.items()}


def compose(specs, recipe):
    """recipe: {'from': {group: spec name}, 'pins': {'cs'|'product'|'agents': spec name}} -> patches and pins,
    taking each group exactly as it was generated in the named spec."""
    built = {name: parts(specs[name]) for name in set(recipe['from'].values()) | set(recipe['pins'].values())}
    P = [p for group, name in recipe['from'].items() for p in built[name][group]]
    pins = [specs[recipe['pins'][k]][key] for k, key in (('cs', 'cs'), ('product', 'product'), ('agents', 'agents'))]
    return P, pins


if __name__ == '__main__':
    specs = json.load(open(sys.argv[1]))
    items, out = [], {}
    for name, v in specs.items():
        if 'recipe' in v:
            P, pins = compose(specs, v['recipe'])
        else:
            P, pins = build(v), [v['cs'], v['product'], v['agents']]
        out[name] = {'patches': P, 'pins': pins}
        items.append((name, P, pins))
        print(name, spread(P)[0])
    json.dump(out, open(sys.argv[2], 'w'))
    sheet(items, sys.argv[3])
