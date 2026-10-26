// A short link opens one encrypted selection of document capabilities.
// Tokens and the decrypted capabilities never belong in public assets.
const MAGIC = new Uint8Array([77, 70, 71, 82, 84, 1]);
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const encoder = new TextEncoder();
const invalid = () => new Error('This portfolio link is incomplete or invalid.');

function encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode(token) {
  if (typeof token !== 'string' || !KEY_PATTERN.test(token)) throw invalid();
  const bytes = Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/') + '='), c => c.charCodeAt(0));
  if (bytes.length !== 32 || encode(bytes) !== token) throw invalid();
  return bytes;
}

function validateIds(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 16 ||
      ids.some(id => typeof id !== 'string' || !ID_PATTERN.test(id)) ||
      new Set(ids).size !== ids.length) throw invalid();
}

function additionalData(ids) {
  validateIds(ids);
  return encoder.encode(`meaningfool-grant:v1:${[...ids].sort().join(',')}`);
}

export function parsePortfolioSelection(search, catalog) {
  const params = new URLSearchParams(search);
  if (params.getAll('documents').length !== 1) throw invalid();
  const ids = params.get('documents').split(',');
  validateIds(ids);
  if (ids.some(id => !catalog.some(doc => doc.id === id))) throw invalid();
  return ids;
}

export async function documentGrantFilename(token) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', decode(token)));
  return `${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}.bin`;
}

export async function createDocumentGrant(documents) {
  const ids = documents.map(doc => doc.id);
  const aad = additionalData(ids);
  const capabilities = documents.map(({ id, key }) => {
    decode(key);
    return { id, key };
  });
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = encode(raw);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key,
    encoder.encode(JSON.stringify({ version: 1, documents: capabilities })),
  ));
  const encrypted = new Uint8Array(18 + ciphertext.length);
  encrypted.set(MAGIC);
  encrypted.set(iv, 6);
  encrypted.set(ciphertext, 18);
  return { token, encrypted, filename: await documentGrantFilename(token) };
}

export async function decryptDocumentGrant(input, token, ids, catalog) {
  try {
    const bytes = new Uint8Array(input);
    if (bytes.length < 35 || bytes.length > 16384 ||
        !MAGIC.every((value, index) => bytes[index] === value)) throw invalid();
    const key = await crypto.subtle.importKey('raw', decode(token), 'AES-GCM', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({
      name: 'AES-GCM', iv: bytes.slice(6, 18), additionalData: additionalData(ids), tagLength: 128,
    }, key, bytes.slice(18));
    const grant = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decrypted));
    if (grant.version !== 1 || !Array.isArray(grant.documents) || grant.documents.length !== ids.length) throw invalid();
    validateIds(grant.documents.map(doc => doc.id));
    return ids.map(id => {
      const capability = grant.documents.find(doc => doc.id === id);
      const document = catalog.find(doc => doc.id === id);
      if (!capability || !document) throw invalid();
      decode(capability.key);
      return { ...document, key: capability.key };
    });
  } catch { throw invalid(); }
}

export function createPortfolioUrl(base, documents, token) {
  const ids = documents.map(doc => doc.id);
  validateIds(ids);
  decode(token);
  const url = new URL('/documents/', base);
  url.search = `?documents=${ids.join(',')}`;
  url.hash = token;
  return url.href;
}
