// The favicon, the paper tile: "m." in the mono font on the panel colour, inside a 1px border, the "m" in ink and the
// full stop in the accent colour. The design and its values are in docs/redesign/paper/README.md.
//
// The glyphs have a line height equal to their size and -0.12em of letter-spacing, and are centred in the tile with
// some space kept under them. Each size has its own values.
//
// The small sizes are kept sharp the way a font's hinting would: the glyphs move by less than half a pixel so the "m"
// starts on a pixel and stands on one, and the full stop, a plain rectangle in DejaVu Sans Mono, is fitted to whole
// pixels, at least 2px a side so it still shows as a square at 16px.
import sharp from 'sharp';
import { baseline, charWidth, inkBox, textPath, type TextStyle } from './mono';

const PANEL = '#f3f3f0';
const BORDER = '#dcdcd6';
const INK = '#151515';
const ACCENT = '#b64b00';

// Tile size: the glyphs' size and the space under them, in px. The 180px tile, the apple-touch-icon, is the design's
// 144px tile (108px glyphs, 14px under them) scaled by 1.25.
const TILES: Record<number, { glyphs: number; under: number }> = {
  16: { glyphs: 12, under: 1 },
  32: { glyphs: 24, under: 3 },
  180: { glyphs: 135, under: 17.5 },
};

/** The tile as an SVG, `size` px wide, with the glyphs converted to paths. */
export function tileSvg(size: number): string {
  const { glyphs, under } = TILES[size];
  const style: TextStyle = { size: glyphs, tracking: -0.12 };
  const m = inkBox('m');
  const ink = (size - 2 * charWidth(style)) / 2 + m.minX * glyphs; // where the "m" starts, centred
  const x = Math.round(ink) - m.minX * glyphs;
  const y = Math.round(baseline((size - under - glyphs) / 2, glyphs, glyphs));

  const stop = inkBox('.');
  const width = Math.max(2, Math.round((stop.maxX - stop.minX) * glyphs));
  const height = Math.max(2, Math.round((stop.maxY - stop.minY) * glyphs));
  const centre = x + charWidth(style) + ((stop.minX + stop.maxX) / 2) * glyphs;
  const left = Math.round(centre - width / 2);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${BORDER}"/>` +
    `<rect x="1" y="1" width="${size - 2}" height="${size - 2}" fill="${PANEL}"/>` +
    `<path fill="${INK}" d="${textPath('m', x, y, style)}"/>` +
    `<path fill="${ACCENT}" d="M${left} ${y - height}h${width}v${height}h${-width}Z"/>` +
    '</svg>'
  );
}

/** The tile as a PNG. */
export function tilePng(size: number): Promise<Buffer> {
  return sharp(Buffer.from(tileSvg(size))).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
}

/** An .ico file holding the tile at each size, each as a PNG, which every browser reads. */
export async function tileIco(sizes: number[]): Promise<Buffer> {
  const images = await Promise.all(sizes.map(tilePng));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2); // an icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry); // width and height, 0 meaning 256
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(images[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}
