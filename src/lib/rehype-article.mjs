/**
 * Shape a post's HTML for the article page's styles (src/styles/prose.css). It runs after rehype-raw, so the HTML
 * written in the Markdown is made of elements too.
 *
 * - An image or a video alone in its paragraph becomes a figure, on a panel. The caption is the image's title, or its
 *   alt text when that is a phrase: an alt text without a space, such as `cost-of-rework`, is a file name.
 * - YouTube embeds load from youtube-nocookie.com, lazily, in a 16:9 figure.
 * - Tables get a wrapper that scrolls sideways when they don't fit. Columns holding only numbers are marked `num`, a row
 *   whose cells are all bold is marked `highlight`, and a paragraph right after a table that starts with "Table:"
 *   becomes its caption.
 * - A numbered list that doesn't start at 1 keeps its numbers, which the page draws itself.
 */
const NUMBER = /^[-+−]?[$€£]?\d[\d.,:/]*\s?(?:%|[a-zµ]{1,3})?$/i;
const PLACEHOLDER = /^(?:[-–—]|n\/a)$/i;
const CAPTION = /^Table:\s*/;

const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
const isElement = (node, ...names) => node?.type === 'element' && (!names.length || names.includes(node.tagName));
const isBlank = (node) => node.type === 'comment' || (node.type === 'text' && !node.value.trim());
const content = (node) => (node.children ?? []).filter((child) => !isBlank(child));
const textOf = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''));
const only = (node) => {
	const children = content(node);
	return children.length === 1 ? children[0] : undefined;
};
const addClass = (node, name) => {
	node.properties.className = [...(node.properties.className ?? []), name];
};

function figure(media, caption) {
	const children = [element('div', { className: ['media'] }, [media])];
	if (caption) children.push(element('figcaption', {}, [{ type: 'text', value: caption }]));
	return element('figure', {}, children);
}

/** The figure for a paragraph that holds only an image (linked or not) or a video. */
function mediaFigure(paragraph) {
	const media = only(paragraph);
	if (isElement(media, 'video')) return figure(media);
	const image = isElement(media, 'a') ? only(media) : media;
	if (!isElement(image, 'img')) return undefined;
	const { title, alt } = image.properties;
	if (typeof title === 'string' && title.trim()) {
		delete image.properties.title;
		return figure(media, title.trim());
	}
	return figure(media, typeof alt === 'string' && /\s/.test(alt.trim()) ? alt.trim() : undefined);
}

/** The youtube-nocookie.com address of a YouTube embed, keeping its parameters, such as the start time. */
function noCookie(src) {
	if (typeof src !== 'string') return undefined;
	let url;
	try {
		url = new URL(src.startsWith('//') ? `https:${src}` : src);
	} catch {
		return undefined;
	}
	if (!/^https?:$/.test(url.protocol) || !/^(?:www\.|m\.)?youtube(?:-nocookie)?\.com$/.test(url.hostname)) return undefined;
	const id = url.pathname.match(/^\/embed\/([\w-]+)\/?$/)?.[1];
	return id && `https://www.youtube-nocookie.com/embed/${id}${url.search}${url.hash}`;
}

/** The youtube-nocookie.com address for an iframe that embeds a YouTube video; undefined for anything else. */
const youTubeSrc = (node) => (isElement(node, 'iframe') ? noCookie(node.properties.src) : undefined);

/** Load a YouTube embed from `src`, lazily. In a figure, the iframe's own sizes give way to the figure's 16:9. */
function lazyNoCookie(iframe, src, inFigure) {
	const { width, height, style, frameBorder, ...rest } = iframe.properties;
	iframe.properties = {
		...(inFigure ? rest : iframe.properties),
		src,
		loading: 'lazy',
		referrerPolicy: 'strict-origin-when-cross-origin',
	};
	return iframe;
}

function embedFigure(iframe) {
	const result = figure(iframe);
	addClass(result.children[0], 'embed');
	return result;
}

function shapeTable(table, captionParagraph) {
	const rows = [];
	(function collect(node) {
		for (const child of node.children ?? []) {
			if (isElement(child, 'tr')) rows.push({ row: child, head: node.tagName === 'thead' });
			else if (isElement(child, 'thead', 'tbody', 'tfoot')) collect(child);
		}
	})(table);
	const cells = (row) => row.children.filter((child) => isElement(child, 'th', 'td'));
	const body = rows.filter(({ head }) => !head).map(({ row }) => row);
	const columns = Math.max(0, ...rows.map(({ row }) => cells(row).length));
	for (let column = 0; column < columns; column++) {
		const values = body.map((row) => (cells(row)[column] ? textOf(cells(row)[column]).trim() : ''));
		const numeric = values.some((value) => NUMBER.test(value))
			&& values.every((value) => !value || NUMBER.test(value) || PLACEHOLDER.test(value));
		if (!numeric) continue;
		for (const { row } of rows) {
			const cell = cells(row)[column];
			if (cell) addClass(cell, 'num');
		}
	}
	for (const row of body) {
		const filled = cells(row).filter((cell) => content(cell).length);
		if (filled.length && filled.every((cell) => isElement(only(cell), 'strong'))) addClass(row, 'highlight');
	}
	if (captionParagraph) {
		const [first, ...rest] = captionParagraph.children;
		const children = first.value.replace(CAPTION, '') ? [{ ...first, value: first.value.replace(CAPTION, '') }, ...rest] : rest;
		table.children.unshift(element('caption', {}, children));
	}
	return element('div', { className: ['table'] }, [table]);
}

function isCaption(node) {
	const first = node?.children?.[0];
	return isElement(node, 'p') && first?.type === 'text' && CAPTION.test(first.value)
		&& Boolean(textOf(node).replace(CAPTION, '').trim());
}

function shape(parent) {
	const children = parent.children ?? [];
	// Whether a figure can go here: not in a paragraph, a link or another figure.
	const holdsBlocks = parent.type === 'root'
		|| isElement(parent, 'div', 'li', 'blockquote', 'section', 'article', 'aside', 'details', 'td', 'th');
	for (let index = 0; index < children.length; index++) {
		const node = children[index];
		if (!isElement(node)) continue;

		const media = holdsBlocks && isElement(node, 'p') && mediaFigure(node);
		if (media) {
			children[index] = media;
			continue;
		}
		// A video written as an HTML block of its own, outside any paragraph.
		if (isElement(node, 'video') && holdsBlocks) {
			children[index] = figure(node);
			continue;
		}
		// An embed alone in its own block, often a <div> that gave it a 16:9 box with inline styles.
		const embed = holdsBlocks && isElement(node, 'div', 'p') ? only(node) : undefined;
		const embedSrc = youTubeSrc(embed);
		if (embedSrc) {
			children[index] = embedFigure(lazyNoCookie(embed, embedSrc, true));
			continue;
		}
		// An embed among other content: a figure where a block can go, or else left in place with its own sizes.
		const src = youTubeSrc(node);
		if (src) {
			lazyNoCookie(node, src, holdsBlocks);
			if (holdsBlocks) children[index] = embedFigure(node);
			continue;
		}
		if (isElement(node, 'table')) {
			let next = index + 1;
			while (next < children.length && isBlank(children[next])) next++;
			const caption = isCaption(children[next]) ? children[next] : undefined;
			if (caption) children.splice(index + 1, next - index);
			shape(node); // what the cells hold
			children[index] = shapeTable(node, caption);
			continue;
		}
		const { start, style } = node.properties;
		if (isElement(node, 'ol') && typeof start === 'number' && start !== 1) {
			node.properties.style = [style, `counter-reset: n ${start - 1}`].filter(Boolean).join('; ');
		}
		shape(node);
	}
}

// Its options go unused: astro.config.mjs passes a hash of the Markdown plugins there, so that Astro renders the posts
// again when they change.
export default function rehypeArticle() {
	return (tree) => shape(tree);
}
