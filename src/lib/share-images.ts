// The share images, 1200×630 PNGs drawn at build time: one per article and one for Home and About. The design and its
// values are in docs/redesign/paper/README.md. All the text is DejaVu Sans Mono, drawn as paths (src/lib/mono.ts).
//
// The frame is white, padded 64px at the top, 72px at the sides and 56px at the bottom, with three rows spread from top
// to bottom: the wordmark and a label tab, the middle, and a line over two pieces of text.
import sharp from 'sharp';
import { baseline, charWidth, textPath, textWidth, wrap, type TextStyle } from './mono';

const WIDTH = 1200;
const HEIGHT = 630;
const TOP = 64;
const SIDE = 72;
const BOTTOM = 56;
const RIGHT = WIDTH - SIDE;

// The colours of src/styles/tokens.css.
const PAPER = '#ffffff';
const INK = '#151515';
const MUTED = '#686862';
const LINE = '#e5e5e2';
const TINT = '#fff9f4';
const ACCENT = '#b64b00';

interface Block {
  height: number;
  draw: (top: number) => string;
}

const rect = (x: number, y: number, width: number, height: number, fill: string) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
const path = (d: string, fill: string) => (d ? `<path fill="${fill}" d="${d}"/>` : '');

/** One line of text in a line box `lineHeight` tall whose top is at `top`, from `x`. */
const line = (text: string, x: number, top: number, lineHeight: number, style: TextStyle, fill: string) =>
  path(textPath(text, x, baseline(top, lineHeight, style.size), style), fill);

/** Lines of text, one under the other. */
function lines(texts: string[], top: number, lineHeight: number, style: TextStyle, fill: string): string {
  return texts.map((text, i) => line(text, SIDE, top + i * lineHeight, lineHeight, style, fill)).join('');
}

function frame(label: string, middle: Block, left: string, right: string): string {
  // Top row, its items centred on each other. Left, the wordmark: mono 36px/36px, -0.055em, the dot in the accent
  // colour. Right, the label tab: mono 20px/28px on the tint, padding 10px 20px 9px, with a 3px accent line under it.
  const mark: TextStyle = { size: 36, tracking: -0.055 };
  const tab: TextStyle = { size: 20 };
  const tabWidth = textWidth(label, tab) + 40;
  const tabHeight = 10 + 28 + 9 + 3;
  const markTop = TOP + (tabHeight - 36) / 2;
  const tabLeft = RIGHT - tabWidth;
  const top =
    line('meaningfool', SIDE, markTop, 36, mark, INK) +
    line('.', SIDE + 11 * charWidth(mark), markTop, 36, mark, ACCENT) +
    rect(tabLeft, TOP, tabWidth, tabHeight - 3, TINT) +
    rect(tabLeft, TOP + tabHeight - 3, tabWidth, 3, ACCENT) +
    line(label, tabLeft + 20, TOP + 10, 28, tab, INK);

  // Bottom row: a 2px line, 24px of space, then mono 22px/30px, ink on the left and muted on the right.
  const foot: TextStyle = { size: 22 };
  const footTop = HEIGHT - BOTTOM - (2 + 24 + 30);
  const bottom =
    rect(SIDE, footTop, RIGHT - SIDE, 2, LINE) +
    line(left, SIDE, footTop + 26, 30, foot, INK) +
    line(right, RIGHT - textWidth(right, foot), footTop + 26, 30, foot, MUTED);

  // The middle, with as much space above as below.
  const space = footTop - (TOP + tabHeight);
  const centre = middle.draw(TOP + tabHeight + (space - middle.height) / 2);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    rect(0, 0, WIDTH, HEIGHT, PAPER) +
    top +
    centre +
    bottom +
    '</svg>'
  );
}

const png = (svg: string) => sharp(Buffer.from(svg)).removeAlpha().png({ compressionLevel: 9 }).toBuffer();

/**
 * An article's image: "Article" on the tab, the title in mono 68px/80px, -0.05em, at most 1020px wide, and the name,
 * date and reading time at the bottom. A title longer than four lines gets smaller until it fits in four.
 */
function articleImageSvg({ title, meta }: { title: string; meta: string }): string {
  let style: TextStyle = { size: 68, tracking: -0.05 };
  let texts = wrap(title, style, 1020);
  while (texts.length > 4 && style.size > 36) {
    style = { ...style, size: style.size - 4 };
    texts = wrap(title, style, 1020);
  }
  if (texts.length > 4) texts = [...texts.slice(0, 3), `${texts[3].slice(0, -1)}…`];
  const lineHeight = Math.round((style.size * 80) / 68);
  const middle = {
    height: texts.length * lineHeight,
    draw: (top: number) => lines(texts, top, lineHeight, style, INK),
  };
  return frame('Article', middle, 'Josselin Perrus', meta);
}

/**
 * The image of Home and About: "Projects · Writing" on the tab, the name in mono 84px/92px, -0.05em, and 20px under it
 * the home's intro in mono 28px/42px, -0.02em, muted, at most 920px wide. At the bottom, the site and its counts.
 */
function siteImageSvg({ intro, counts }: { intro: string; counts: string }): string {
  const name: TextStyle = { size: 84, tracking: -0.05 };
  const lede: TextStyle = { size: 28, tracking: -0.02 };
  const texts = wrap(intro, lede, 920);
  const middle = {
    height: 92 + 20 + texts.length * 42,
    draw: (top: number) => line('Josselin Perrus', SIDE, top, 92, name, INK) + lines(texts, top + 112, 42, lede, MUTED),
  };
  return frame('Projects · Writing', middle, 'meaningfool.net', counts);
}

export const articleImage = (text: { title: string; meta: string }) => png(articleImageSvg(text));
export const siteImage = (text: { intro: string; counts: string }) => png(siteImageSvg(text));
