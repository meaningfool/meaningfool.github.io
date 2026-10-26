import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptPdf } from '../src/lib/shared-documents.mjs';
import { createDocumentGrant, decryptDocumentGrant, documentGrantFilename, createPortfolioUrl, parsePortfolioSelection } from '../src/lib/document-grants.mjs';

const catalog = [{ id: 'ai-portfolio', title: 'AI Portfolio' }, { id: 'recommendation', title: 'Recommendation' }];
async function capabilities() {
  const pdf = new TextEncoder().encode('%PDF-1.7\nA fixture\n%%EOF');
  return Promise.all(catalog.map(async doc => ({ ...doc, key: (await encryptPdf(pdf, doc.id)).key })));
}

test('one token unlocks exactly the named selection, with readable query and fragment-only token', async () => {
  const docs = await capabilities();
  const grant = await createDocumentGrant(docs);
  const url = new URL(createPortfolioUrl('https://meaningfool.net', docs, grant.token));
  assert.equal(url.search, '?documents=ai-portfolio,recommendation');
  assert.equal(url.hash, '#' + grant.token);
  assert.equal(url.href.includes(docs[0].key), false);
  assert.match(grant.filename, /^[a-f0-9]{64}\.bin$/);
  assert.equal(grant.filename.includes(grant.token), false);
  assert.equal(grant.filename, await documentGrantFilename(grant.token));
  const ids = parsePortfolioSelection(url.search, catalog);
  assert.deepEqual(await decryptDocumentGrant(grant.encrypted, grant.token, ids, catalog), docs);
  assert.deepEqual((await decryptDocumentGrant(grant.encrypted, grant.token, [...ids].reverse(), catalog)).map(doc => doc.id), [...ids].reverse());
});

test('adding or removing document names invalidates a token instead of expanding access', async () => {
  const docs = await capabilities();
  const single = await createDocumentGrant([docs[0]]);
  const all = await createDocumentGrant(docs);
  await assert.rejects(decryptDocumentGrant(single.encrypted, single.token, catalog.map(doc => doc.id), catalog));
  await assert.rejects(decryptDocumentGrant(all.encrypted, all.token, [docs[0].id], catalog));
  await assert.rejects(decryptDocumentGrant(single.encrypted, all.token, [docs[0].id], catalog));
  const corrupt = single.encrypted.slice(); corrupt[20] ^= 1;
  await assert.rejects(decryptDocumentGrant(corrupt, single.token, [docs[0].id], catalog));
  await assert.rejects(decryptDocumentGrant(single.encrypted.slice(0, 30), single.token, [docs[0].id], catalog));
});

test('malformed tokens and ambiguous document lists are rejected', async () => {
  for (const search of ['', '?documents=', '?documents=ai-portfolio,ai-portfolio', '?documents=ai-portfolio&documents=recommendation', '?documents=unknown']) {
    assert.throws(() => parsePortfolioSelection(search, catalog));
  }
  await assert.rejects(documentGrantFilename('guess'));
  const docs = await capabilities();
  await assert.rejects(createDocumentGrant([docs[0], docs[0]]));
  const one = await createDocumentGrant(docs);
  const two = await createDocumentGrant(docs);
  assert.notEqual(one.token, two.token);
  assert.notEqual(one.filename, two.filename);
});
