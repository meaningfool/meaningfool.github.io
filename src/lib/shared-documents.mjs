// Public code only. Document keys belong in the owner's private link file.
const MAGIC = new Uint8Array([77, 70, 80, 68, 70, 1]); // MFPDF, format v1
const IV_BYTES = 12;
const MAX_BYTES = 25 * 1024 * 1024;
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const KEY = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();

function invalid() {
  return new Error('This document link is incomplete or invalid.');
}

function aad(id) {
  if (!ID.test(id)) throw invalid();
  return encoder.encode(`meaningfool-pdf:v1:${id}`);
}

function encodeKey(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeKey(key) {
  if (!KEY.test(key)) throw invalid();
  const bytes = Uint8Array.from(atob(key.replaceAll('-', '+').replaceAll('_', '/') + '='), c => c.charCodeAt(0));
  if (bytes.length !== 32 || encodeKey(bytes) !== key) throw invalid();
  return bytes;
}

function isPdf(bytes) {
  return bytes.length >= 5 && bytes[0] === 37 && bytes[1] === 80 &&
    bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45;
}

/** Parse capabilities from the URL fragment, never from query parameters. */
export function parseShareFragment(hash, documents) {
  if (!hash || hash === '#') return [];
  if (hash.length > 8192) throw invalid();
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const available = new Map(documents.map(doc => [doc.id, doc]));
  const seen = new Set();
  const selected = [];
  for (const [id, key] of params) {
    const document = available.get(id);
    if (!document || seen.has(id)) throw invalid();
    decodeKey(key);
    seen.add(id);
    selected.push({ ...document, key });
  }
  if (selected.length === 0) throw invalid();
  return selected;
}

/** Encrypt using a fresh independent AES-256-GCM key and 96-bit nonce. */
export async function encryptPdf(input, id) {
  const bytes = new Uint8Array(input);
  if (!isPdf(bytes) || bytes.length > MAX_BYTES) throw new Error('Expected a PDF smaller than 25 MiB.');
  const additionalData = aad(id);
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData, tagLength: 128 }, key, bytes,
  ));
  const encrypted = new Uint8Array(MAGIC.length + IV_BYTES + ciphertext.length);
  encrypted.set(MAGIC);
  encrypted.set(iv, MAGIC.length);
  encrypted.set(ciphertext, MAGIC.length + IV_BYTES);
  return { encrypted, key: encodeKey(rawKey) };
}

/** Authenticate the envelope and document name before returning PDF bytes. */
export async function decryptPdf(input, id, encodedKey) {
  const bytes = new Uint8Array(input);
  const offset = MAGIC.length + IV_BYTES;
  if (bytes.length < offset + 16 + 5 || bytes.length > MAX_BYTES + offset + 16 ||
      !MAGIC.every((value, index) => bytes[index] === value)) throw invalid();
  try {
    const key = await crypto.subtle.importKey('raw', decodeKey(encodedKey), 'AES-GCM', false, ['decrypt']);
    const decrypted = new Uint8Array(await crypto.subtle.decrypt({
      name: 'AES-GCM',
      iv: bytes.slice(MAGIC.length, offset),
      additionalData: aad(id),
      tagLength: 128,
    }, key, bytes.slice(offset)));
    if (!isPdf(decrypted)) throw invalid();
    return decrypted;
  } catch {
    throw invalid();
  }
}

export function createShareUrl(base, documents) {
  const url = new URL('/documents', base);
  const params = new URLSearchParams();
  for (const { id, key } of documents) {
    if (!ID.test(id) || params.has(id)) throw invalid();
    decodeKey(key);
    params.set(id, key);
  }
  if (!params.size) throw invalid();
  url.hash = params.toString();
  return url.href;
}
