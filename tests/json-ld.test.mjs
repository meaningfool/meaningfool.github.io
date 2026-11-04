import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd } from '../src/lib/json-ld.mjs';

test('JSON-LD escapes <, >, &, U+2028 and U+2029 and still parses to the same value', () => {
  const data = {
    '@type': 'BlogPosting',
    headline: 'Ends early </script><b>x</b> & <!-- comment --> > done',
    description: 'Line\u2028and paragraph\u2029separators',
    keywords: ['</SCRIPT >', 'a&b'],
  };
  const json = serializeJsonLd(data);
  // With no `<` left, the browser can't find `</script` or `<!--`, so the whole JSON stays in the script element.
  assert.doesNotMatch(json, /[<>&\u2028\u2029]/);
  assert.match(json, /"Ends early \\u003c\/script\\u003e\\u003cb\\u003ex\\u003c\/b\\u003e \\u0026 \\u003c!-- comment/);
  assert.match(json, /"Line\\u2028and paragraph\\u2029separators"/);
  assert.deepEqual(JSON.parse(json), data);
});

test('JSON-LD without those characters is plain JSON.stringify', () => {
  const data = { '@context': 'https://schema.org', name: 'meaningfool', sameAs: ['https://github.com/meaningfool'] };
  assert.equal(serializeJsonLd(data), JSON.stringify(data));
});
