import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptPdf, decryptPdf, parseShareFragment, createShareUrl } from '../src/lib/shared-documents.mjs';

const pdf = new TextEncoder().encode('%PDF-1.7\nA private fixture\n%%EOF');
const documents = [{ id: 'ai-portfolio', title: 'AI Portfolio' }, { id: 'recommendation', title: 'Recommendation' }];

test('round-trips bytes and generates independent document capabilities', async () => {
  const one = await encryptPdf(pdf, 'ai-portfolio');
  const two = await encryptPdf(pdf, 'ai-portfolio');
  assert.notEqual(one.key, two.key);
  assert.notDeepEqual(one.encrypted, two.encrypted);
  assert.deepEqual(await decryptPdf(one.encrypted, 'ai-portfolio', one.key), pdf);
  assert.equal(new TextDecoder().decode(one.encrypted).includes('A private fixture'), false);
});

test('rejects wrong keys, renamed files, tampering, truncated and invalid envelopes', async () => {
  const one = await encryptPdf(pdf, 'ai-portfolio');
  const other = await encryptPdf(pdf, 'recommendation');
  await assert.rejects(decryptPdf(one.encrypted, 'ai-portfolio', other.key));
  await assert.rejects(decryptPdf(one.encrypted, 'recommendation', one.key));
  const changed = one.encrypted.slice();
  changed[changed.length - 2] ^= 1;
  await assert.rejects(decryptPdf(changed, 'ai-portfolio', one.key));
  await assert.rejects(decryptPdf(one.encrypted.slice(0, 20), 'ai-portfolio', one.key));
  await assert.rejects(decryptPdf(pdf, 'ai-portfolio', one.key));
  await assert.rejects(decryptPdf(one.encrypted, 'ai-portfolio', 'guess'));
});

test('share URLs contain only selected capabilities, entirely after the fragment', async () => {
  const one = await encryptPdf(pdf, 'ai-portfolio');
  const url = new URL(createShareUrl('https://meaningfool.net', [{ id: 'ai-portfolio', key: one.key }]));
  assert.equal(url.pathname, '/documents');
  assert.equal(url.search, '');
  assert.equal(url.hash.includes('recommendation'), false);
  assert.deepEqual(parseShareFragment(url.hash, documents).map(doc => doc.id), ['ai-portfolio']);
  assert.deepEqual(parseShareFragment('', documents), []);
});

test('rejects malformed, duplicate, unknown and keyless document selectors', async () => {
  const { key } = await encryptPdf(pdf, 'ai-portfolio');
  for (const fragment of [
    '#ai-portfolio', '#docs=ai-portfolio', '#ai-portfolio=guess',
    `#ai-portfolio=${key}&ai-portfolio=${key}`,
    `#ai-portfolio=${key}&recommendation=`,
    `#unknown=${key}`, `#../secret=${key}`, `#ai-portfolio=${'a'.repeat(9000)}`,
  ]) assert.throws(() => parseShareFragment(fragment, documents));
});

test('adding another name with a known key cannot decrypt the other file', async () => {
  const one = await encryptPdf(pdf, 'ai-portfolio');
  const two = await encryptPdf(pdf, 'recommendation');
  const guessed = parseShareFragment(`#recommendation=${one.key}`, documents)[0];
  await assert.rejects(decryptPdf(two.encrypted, guessed.id, guessed.key));
});
