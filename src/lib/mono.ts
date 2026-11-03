// DejaVu Sans Mono as SVG paths, for the images the build draws: the share images and the favicon. They use the
// site's own subset (src/fonts/), so they show the same letters as the pages, and as paths they need no font where
// they are shown. Text is laid out as a browser lays it out: every character takes the same width plus the
// letter-spacing, lines break at spaces and after hyphens, and a line box puts its baseline where CSS puts it.
import { create, type Font } from 'fontkitten';
import fontData from '../fonts/dejavu-sans-mono.woff2?inline';

const font = create(Buffer.from(fontData.slice(fontData.indexOf(',') + 1), 'base64')) as Font;
const EM = font.unitsPerEm;
const ASCENT = font.ascent / EM;
const DESCENT = -font.descent / EM;
const ADVANCE = font.glyphForCodePoint(0x6d).advanceWidth / EM; // 0.602em: in a mono font, every character's width

const COMMANDS = { moveTo: 'M', lineTo: 'L', quadraticCurveTo: 'Q', bezierCurveTo: 'C', closePath: 'Z' };

export interface TextStyle {
  size: number; // font size, in px
  tracking?: number; // letter-spacing, in em
}

const chars = (text: string) => Array.from(text);
const num = (value: number) => String(Math.round(value * 100) / 100);

/** The width one character takes, letter-spacing included. */
export function charWidth({ size, tracking = 0 }: TextStyle): number {
  return size * (ADVANCE + tracking);
}

/** The width of a line of text. As in Chrome, the last character keeps its letter-spacing. */
export function textWidth(text: string, style: TextStyle): number {
  return chars(text).length * charWidth(style);
}

/** Where CSS puts the baseline in a line box `lineHeight` tall whose top is at `top`. */
export function baseline(top: number, lineHeight: number, size: number): number {
  return top + (lineHeight - (ASCENT + DESCENT) * size) / 2 + ASCENT * size;
}

/** A character's ink, in em from its origin on the baseline, y going up. */
export function inkBox(char: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const { minX, minY, maxX, maxY } = font.glyphForCodePoint(char.codePointAt(0)!).bbox;
  return { minX: minX / EM, minY: minY / EM, maxX: maxX / EM, maxY: maxY / EM };
}

/** SVG path data for one line of text, starting at `x` on the baseline `y`. */
export function textPath(text: string, x: number, y: number, style: TextStyle): string {
  const scale = style.size / EM;
  const step = charWidth(style);
  const missing = new Set<string>();
  let d = '';
  chars(text).forEach((char, i) => {
    const glyph = font.glyphForCodePoint(char.codePointAt(0)!);
    if (glyph.id === 0 && char.trim()) missing.add(char);
    const left = x + i * step;
    for (const { command, args } of glyph.path.commands) {
      d += COMMANDS[command] + args.map((v, j) => num(j % 2 ? y - v * scale : left + v * scale)).join(' ');
    }
  });
  if (missing.size) {
    // The subset only holds Latin, punctuation, arrows and box drawing (scripts/subset-fonts.py).
    console.warn(`[mono] DejaVu Sans Mono's subset has no ${[...missing].join(' ')}, drawn as a box in "${text}"`);
  }
  return d;
}

/**
 * Break text into lines at most `maxWidth` wide, as a browser does: at spaces and after a hyphen between letters,
 * the space at the end of a line not counting. A word longer than a line breaks where it reaches the end.
 */
export function wrap(text: string, style: TextStyle, maxWidth: number): string[] {
  const max = Math.max(1, Math.floor(maxWidth / charWidth(style) + 1e-9));
  const fits = (line: string) => chars(line.trimEnd()).length <= max;
  const pieces = text.replace(/\s+/g, ' ').trim().split(/(?<= )|(?<=[\p{L}\p{N}]-)(?=[\p{L}\p{N}])/u);
  const lines: string[] = [];
  let line = '';
  for (let piece of pieces) {
    if (line && !fits(line + piece)) {
      lines.push(line.trimEnd());
      line = '';
    }
    while (!fits(piece)) {
      lines.push(chars(piece).slice(0, max).join(''));
      piece = chars(piece).slice(max).join('');
    }
    line += piece;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}
