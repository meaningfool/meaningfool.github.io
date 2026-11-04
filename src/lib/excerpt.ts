const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(html: string): string {
	return html.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
		if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? match;
		const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
		return point <= 0x10ffff ? String.fromCodePoint(point) : match;
	});
}

// A tag, whose quoted attribute values may hold a ">".
const TAG = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
const textOf = (html: string) => decode(html.replace(TAG, '')).replace(/\s+/g, ' ').trim();

/** The HTML without its lists, quotes, tables and figures, innermost first, so that only the text's own paragraphs stay. */
function withoutBlocks(html: string): string {
	const innermost = /<(ul|ol|blockquote|table|figure)\b[^>]*>(?:(?!<\/?(?:ul|ol|blockquote|table|figure)\b)[\s\S])*<\/\1>/g;
	for (let previous = ''; previous !== html; ) [previous, html] = [html, html.replace(innermost, ' ')];
	return html;
}

/** A paragraph's text. Its line breaks become spaces, or full stops between a line and one that starts a sentence. */
function paragraphText(html: string): string {
	return html.split(/<br\s*\/?>/).map(textOf).filter(Boolean).reduce((text, line) => {
		if (!text) return line;
		return /[\p{L}\p{N}]$/u.test(text) && /^\p{Lu}/u.test(line) ? `${text}. ${line}` : `${text} ${line}`;
	}, '');
}

const SENTENCE_END = /[.!?…]["”’)]?$/;

/**
 * A post's meta description when its frontmatter has none, from its rendered HTML: the text of its first paragraph,
 * and of the next when the first is very short. Paragraphs in lists, quotes, tables and figures don't count. A
 * paragraph that leads into a list ("…the likes:") is cut back to its last full sentence, or ends with an ellipsis,
 * unless it is a short label, which is skipped. The result is cut at a word to stay within `max` characters, and is
 * empty when the post has no paragraph to take.
 */
export function excerpt(html: string, max = 160): string {
	let text = '';
	for (const [, inner] of withoutBlocks(html).matchAll(/<p>([\s\S]*?)<\/p>/g)) {
		let paragraph = paragraphText(inner);
		if (!SENTENCE_END.test(paragraph)) {
			// Its whole sentences, unless that leaves little more than an abbreviation such as "e.g."
			const whole = paragraph.match(/^.*[.!?…]["”’)]?(?=\s)/)?.[0];
			const sentences = whole && whole.length >= 40 ? whole : undefined;
			// A short label such as "Readings:" over a list says nothing on its own: skip it, or stop at it.
			if (!sentences && paragraph.length < 50) {
				if (text) break;
				continue;
			}
			paragraph = sentences ?? `${paragraph.replace(/[\s,;:–—-]+$/, '')}…`;
			text = text ? `${text} ${paragraph}` : paragraph;
			break;
		}
		text = text ? `${text} ${paragraph}` : paragraph;
		if (text.length >= 50) break;
	}
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const end = cut.lastIndexOf(' ');
	return `${(end > 0 ? cut.slice(0, end) : cut.slice(0, max - 1)).replace(/[\s,;:.–—-]+$/, '')}…`;
}
