// Reading time, as the redesign shows it next to a post's date.

/**
 * Minutes to read a post: the words of its Markdown body at 230 a minute, rounded up, and at least 1. This gives the
 * prototype's reading times (docs/redesign/prototype/maps.js) for all its articles but the longest, 40 minutes
 * instead of 39.
 */
export function readingMinutes(markdown = '') {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}
