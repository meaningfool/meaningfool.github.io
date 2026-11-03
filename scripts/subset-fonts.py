"""Make the site's self-hosted fonts in src/fonts/ from the original font files.

- DejaVu Sans Mono 2.37, Book: the text of everything but articles and About. The build also draws the share images
  and the favicon from it (src/lib/mono.ts), so a character missing from it shows as a box in a share image.
- Newsreader 1.003, regular and italic: the text of articles and About. Its weight is fixed at 400 and its optical size
  axis (6 to 72) is kept, as Google Fonts serves it to the prototype.

Each font keeps only the characters in its RANGES, which the @font-face rules in src/styles/tokens.css repeat as their
unicode-range, so anything else falls back to the next font in the stack. DejaVu Sans Mono leaves out the symbols that
are also emoji, such as the star or the check mark, so they show as emoji. The fonts keep their whole name table, with
the copyright and licence. The licences are next to the fonts: LICENSE-DejaVu.txt and OFL-Newsreader.txt.

Run from the repository root, with fontTools and brotli installed (pip install fonttools brotli):

    python3 scripts/subset-fonts.py

It downloads the originals, checks their SHA-256, and overwrites the .woff2 files in src/fonts/. The same originals
give the same files.
"""
import hashlib
import io
import os
import tarfile
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "fonts")

# Latin, as Google Fonts subsets it: ASCII, Latin-1, the French and other Western European extras, punctuation, euro.
LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
# The mono font also draws arrows (← → ↗) and box drawing (├── └──) for code and labels.
RANGES = {
    "mono": LATIN + ", U+2190-21FF, U+2500-257F",
    "serif": LATIN,
}

FONTS = [
    {
        "out": "dejavu-sans-mono.woff2",
        "url": "https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2",
        "member": "dejavu-fonts-ttf-2.37/ttf/DejaVuSansMono.ttf",
        "sha256": "b4a6c3e4faab8773f4ff761d56451646409f29abedd68f05d38c2df667d3c582",
        "ranges": RANGES["mono"],
    },
    {
        "out": "newsreader.woff2",
        "url": "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf",
        "sha256": "8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1",
        "ranges": RANGES["serif"],
        "pin": {"wght": 400},
    },
    {
        "out": "newsreader-italic.woff2",
        "url": "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader-Italic%5Bopsz,wght%5D.ttf",
        "sha256": "796668611f80b64d5adf182fde3b6f29ed83b4e7cbec7b96937e84ac01364792",
        "ranges": RANGES["serif"],
        "pin": {"wght": 400},
    },
]


def unicodes(ranges):
    """The code points of a CSS unicode-range list."""
    points = []
    for part in ranges.split(","):
        lo, _, hi = part.strip()[2:].partition("-")
        points.extend(range(int(lo, 16), int(hi or lo, 16) + 1))
    return points


def original(spec):
    data = urllib.request.urlopen(spec["url"]).read()
    if "member" in spec:
        data = tarfile.open(fileobj=io.BytesIO(data)).extractfile(spec["member"]).read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != spec["sha256"]:
        raise SystemExit(f"{spec['out']}: the original's SHA-256 is {digest}, expected {spec['sha256']}")
    return TTFont(io.BytesIO(data))


def main():
    for spec in FONTS:
        font = original(spec)
        if "pin" in spec:
            font = instancer.instantiateVariableFont(font, spec["pin"])
        options = subset.Options()
        options.flavor = "woff2"
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.layout_features = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=unicodes(spec["ranges"]))
        subsetter.subset(font)
        path = os.path.join(OUT, spec["out"])
        font.flavor = "woff2"
        font.recalcTimestamp = False  # keep the original's date, so the same originals give the same files
        font.save(path)
        print(spec["out"], os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    main()
