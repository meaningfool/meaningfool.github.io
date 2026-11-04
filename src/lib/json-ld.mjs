// JSON-LD for a <script type="application/ld+json"> element, which the browser ends at the first `</script`.

const UNSAFE = /[<>&\u2028\u2029]/g;

/**
 * `data` as JSON, with `<`, `>`, `&`, U+2028 and U+2029 written as `\u` escapes. A string holding `</script>` or `<!--`
 * then stays inside the script element, and the JSON still parses to the same value.
 */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(UNSAFE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
