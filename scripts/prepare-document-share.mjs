#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readFile, readdir, realpath, rename, stat, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShareUrl, encryptPdf } from '../src/lib/shared-documents.mjs';

const REPOSITORY = fileURLToPath(new URL('../', import.meta.url));
const BASE_URL = 'https://meaningfool.net';
const MAX_BYTES = 25 * 1024 * 1024;
const DOCUMENT_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const PRIVATE_FILES = ['document-share-keys.json', 'manage-document-links.html'];

function fail(message) {
  throw new Error(message);
}

function parseArguments(arguments_) {
  if (arguments_.length === 1 && ['--help', '-h'].includes(arguments_[0])) return null;
  const options = {};
  for (let index = 0; index < arguments_.length; index += 2) {
    const name = arguments_[index];
    if (!['--manifest', '--private-output'].includes(name) || options[name] !== undefined) {
      fail('Use --manifest /absolute/input.json --private-output /absolute/private-directory.');
    }
    const value = arguments_[index + 1];
    if (!value || !isAbsolute(value)) fail(`${name} requires an absolute path.`);
    options[name] = resolve(value);
  }
  if (!options['--manifest'] || !options['--private-output']) {
    fail('Both --manifest and --private-output are required. Use --help for usage.');
  }
  return { manifest: options['--manifest'], privateOutput: options['--private-output'] };
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Resolve existing ancestors too, so a symlink cannot disguise an output inside
// the repository even when the final private directory has not been created yet.
async function canonicalPath(path) {
  let ancestor = resolve(path);
  const missing = [];
  for (;;) {
    try {
      return join(await realpath(ancestor), ...missing.reverse());
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (await exists(ancestor)) fail(`Cannot resolve the existing path: ${ancestor}`);
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.push(relative(parent, ancestor));
      ancestor = parent;
    }
  }
}

function isWithin(directory, path) {
  const difference = relative(directory, path);
  return difference === '' || (difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference));
}

async function readDocuments(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) fail('The manifest must contain valid JSON.');
    throw error;
  }
  if (!manifest || !Array.isArray(manifest.documents) || manifest.documents.length === 0) {
    fail('The manifest must contain a nonempty documents array.');
  }

  const seen = new Set();
  const validated = [];
  for (const document of manifest.documents) {
    if (!document || typeof document.id !== 'string' || !DOCUMENT_ID.test(document.id)) {
      fail('Every document needs a named ID using lowercase letters, digits and single hyphens, starting with a letter.');
    }
    const { id } = document;
    if (seen.has(id)) fail(`Duplicate document ID: ${id}`);
    seen.add(id);
    if (typeof document.title !== 'string' || !document.title.trim()) fail(`Missing title for ${id}.`);
    if (typeof document.file !== 'string' || !document.file || isAbsolute(document.file)) {
      fail(`The file for ${id} must be a path relative to the manifest directory.`);
    }
    if (!Number.isSafeInteger(document.pages) || document.pages < 1) fail(`Invalid page count for ${id}.`);
    if (!Number.isSafeInteger(document.bytes) || document.bytes < 5 || document.bytes > MAX_BYTES) {
      fail(`Invalid byte count for ${id}; each PDF must be at most 25 MiB.`);
    }
    if (typeof document.sha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(document.sha256)) {
      fail(`Invalid SHA-256 digest for ${id}.`);
    }

    const source = resolve(dirname(manifestPath), document.file);
    const fileStat = await stat(source);
    if (!fileStat.isFile()) fail(`The input for ${id} must be a regular file.`);
    if (fileStat.size !== document.bytes) fail(`The input byte count does not match the manifest for ${id}.`);
    const bytes = await readFile(source);
    if (bytes.length !== document.bytes || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      fail(`The input for ${id} is not the expected PDF.`);
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== document.sha256.toLowerCase()) fail(`The SHA-256 digest does not match for ${id}.`);
    validated.push({ id, title: document.title.trim(), pages: document.pages, bytes: document.bytes, plaintext: bytes });
  }
  return validated;
}

async function checkOutputPaths(privateOutput, assetDirectory, catalogPath, documents) {
  const repository = await realpath(REPOSITORY);
  const privateDirectory = await canonicalPath(privateOutput);
  if (isWithin(resolve(REPOSITORY), privateOutput) || isWithin(repository, privateDirectory)) {
    fail('The private output directory must be outside the repository, including its dist directory.');
  }
  if (await exists(privateOutput)) {
    if (!(await stat(privateOutput)).isDirectory()) fail('The private output path must be a directory.');
  }
  for (const name of PRIVATE_FILES) {
    if (await exists(join(privateOutput, name))) {
      fail(`Refusing to replace the existing private file: ${join(privateOutput, name)}`);
    }
  }
  for (const path of [assetDirectory, dirname(catalogPath)]) {
    if (!isWithin(repository, await canonicalPath(path))) fail(`Public output resolves outside the repository: ${path}`);
  }
  if (await exists(assetDirectory)) {
    if (!(await stat(assetDirectory)).isDirectory()) fail('The shared-document asset path must be a directory.');
    if ((await readdir(assetDirectory)).some(name => name.endsWith('.bin'))) {
      fail('Encrypted document assets already exist. Explicitly archive/remove them before preparing fresh keys; see docs/document-sharing.md.');
    }
  }
  for (const { id } of documents) {
    if (await exists(join(assetDirectory, `${id}.bin`))) fail(`Refusing to replace the encrypted asset for ${id}.`);
  }
  if (await exists(catalogPath)) {
    if (!(await lstat(catalogPath)).isFile()) fail('The existing public document catalog must be a regular file.');
  }
}

function managerHtml(documents) {
  const style = `
    :root { color-scheme: light; font-family: system-ui, sans-serif; color: #172529; background: #f3f5f4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px 20px; }
    main { max-width: 760px; margin: auto; padding: 32px; background: white; border: 1px solid #dce4df; border-radius: 18px; }
    h1 { margin: 0 0 12px; font-size: 1.8rem; }
    p { line-height: 1.5; }
    .warning { padding: 14px 16px; background: #fff3d7; border-radius: 8px; color: #614700; }
    fieldset { margin: 28px 0 24px; padding: 0; border: 0; }
    legend { font-weight: 650; margin-bottom: 12px; }
    .document { display: flex; gap: 12px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e5e9e6; cursor: pointer; }
    .document input { width: 18px; height: 18px; margin: 3px 0 0; accent-color: #226849; }
    .document strong, .document small { display: block; }
    .document small { color: #5d6d64; margin-top: 4px; overflow-wrap: anywhere; }
    .link-label { display: block; font-weight: 650; margin-bottom: 8px; }
    textarea { width: 100%; min-height: 110px; padding: 12px; resize: vertical; border: 1px solid #bac8bf; border-radius: 8px; font: 0.8rem/1.5 ui-monospace, monospace; color: #172529; background: #f8faf8; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    button { padding: 11px 16px; border: 1px solid #226849; border-radius: 8px; background: #226849; color: white; font: inherit; font-weight: 600; cursor: pointer; }
    button.secondary { background: white; color: #226849; }
    button:disabled { opacity: 0.45; cursor: default; }
    button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #91bfa5; outline-offset: 3px; }
    #status { min-height: 24px; font-size: 0.9rem; color: #41564a; }
    footer { color: #5d6d64; font-size: 0.9rem; line-height: 1.5; margin-top: 24px; }
    @media (max-width: 480px) { body { padding: 16px 10px; } main { padding: 22px 18px; } }
  `;
  const safeDocuments = JSON.stringify(documents).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const script = `
    'use strict';
    const documents = ${safeDocuments};
    const baseUrl = ${JSON.stringify(BASE_URL)};
    const choices = document.getElementById('choices');
    const urlField = document.getElementById('share-url');
    const copyButton = document.getElementById('copy');
    const openButton = document.getElementById('open');
    const status = document.getElementById('status');
    const checkboxes = [];
    for (const item of documents) {
      const label = document.createElement('label');
      label.className = 'document';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.value = item.id;
      checkbox.addEventListener('change', update);
      checkboxes.push(checkbox);
      const text = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const name = document.createElement('small');
      name.textContent = item.id;
      text.append(title, name);
      label.append(checkbox, text);
      choices.append(label);
    }
    function update() {
      const selected = documents.filter((item, index) => checkboxes[index].checked);
      copyButton.disabled = openButton.disabled = selected.length === 0;
      if (!selected.length) {
        urlField.value = '';
        status.textContent = 'Select at least one document.';
        return;
      }
      const url = new URL('/documents', baseUrl);
      const parameters = new URLSearchParams();
      for (const item of selected) parameters.set(item.id, item.key);
      url.hash = parameters.toString();
      urlField.value = url.href;
      status.textContent = selected.length + (selected.length === 1 ? ' document selected.' : ' documents selected.');
    }
    copyButton.addEventListener('click', async () => {
      const link = urlField.value;
      if (!link) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(link);
        status.textContent = 'Link copied.';
      } catch {
        urlField.focus();
        urlField.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch {}
        status.textContent = copied ? 'Link copied.' : 'Link selected. Press Command+C or Ctrl+C to copy.';
      }
    });
    openButton.addEventListener('click', () => {
      if (urlField.value) window.open(urlField.value, '_blank', 'noopener,noreferrer');
    });
    update();
  `;
  const hash = content => createHash('sha256').update(content).digest('base64');
  const csp = `default-src 'none'; script-src 'sha256-${hash(script)}'; style-src 'sha256-${hash(style)}'; base-uri 'none'; form-action 'none'; object-src 'none'; connect-src 'none'`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="referrer" content="no-referrer">
  <meta name="robots" content="noindex,nofollow">
  <title>Document link builder — private</title>
  <style>${style}</style>
</head>
<body>
  <main>
    <h1>Share documents</h1>
    <p class="warning">Keep this file private. It contains access links to all documents.</p>
    <p>Choose the documents to include, then copy the link to share it.</p>
    <fieldset><legend>Documents to share</legend><div id="choices"></div></fieldset>
    <label class="link-label" for="share-url">Your sharing link</label>
    <textarea id="share-url" readonly spellcheck="false" aria-describedby="status"></textarea>
    <div class="actions"><button id="copy" disabled>Copy link</button><button id="open" class="secondary" disabled>Open selection</button></div>
    <p id="status" role="status" aria-live="polite">Loading document choices…</p>
    <noscript><p>Enable JavaScript in your browser to build a link.</p></noscript>
    <footer>Anyone with a sharing link can view, save and forward its selected documents. This builder works locally; Open selection opens the public website.</footer>
  </main>
  <script>${script}</script>
</body>
</html>
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options) {
    console.log('Usage: node scripts/prepare-document-share.mjs --manifest /absolute/input.json --private-output /absolute/private-directory');
    console.log('Requires Node.js 20 or later. Inputs are verified before writes; private output must be outside the repository.');
    return;
  }
  if (Number(process.versions.node.split('.')[0]) < 20 || !globalThis.crypto?.subtle) fail('Node.js 20 or later with Web Crypto is required.');

  const documents = await readDocuments(options.manifest);
  const assetDirectory = join(REPOSITORY, 'public/shared-documents');
  const catalogPath = join(REPOSITORY, 'src/data/shared-documents.json');
  await checkOutputPaths(options.privateOutput, assetDirectory, catalogPath, documents);

  const privateDocuments = [];
  const assets = [];
  const catalog = [];
  for (const document of documents) {
    const { encrypted, key } = await encryptPdf(document.plaintext, document.id);
    privateDocuments.push({ id: document.id, title: document.title, key });
    assets.push({ path: join(assetDirectory, `${document.id}.bin`), data: encrypted });
    catalog.push({
      id: document.id,
      title: document.title,
      file: `/shared-documents/${document.id}.bin`,
      filename: `${document.id}.pdf`,
      bytes: document.bytes,
      pages: document.pages,
    });
  }
  if (new URL(createShareUrl(BASE_URL, privateDocuments)).hash.length > 8192) fail('The combined document link would exceed the viewer limit.');
  const keys = `${JSON.stringify({ version: 1, baseUrl: BASE_URL, documents: privateDocuments }, null, 2)}\n`;
  const manager = managerHtml(privateDocuments);

  // Finish every validation and encryption before creating even a directory.
  // Repeat the preflight because encryption may have taken some time.
  await checkOutputPaths(options.privateOutput, assetDirectory, catalogPath, documents);
  const createdFiles = [];
  async function writeNew(path, data, mode) {
    const handle = await open(path, 'wx', mode);
    createdFiles.push(path);
    try {
      await handle.writeFile(data);
      await handle.chmod(mode);
    } finally {
      await handle.close();
    }
  }
  try {
    await mkdir(options.privateOutput, { recursive: true, mode: 0o700 });
    await mkdir(assetDirectory, { recursive: true });
    await mkdir(dirname(catalogPath), { recursive: true });
    await writeNew(join(options.privateOutput, PRIVATE_FILES[0]), keys, 0o600);
    await writeNew(join(options.privateOutput, PRIVATE_FILES[1]), manager, 0o600);
    for (const asset of assets) await writeNew(asset.path, asset.data, 0o644);
    const temporaryCatalog = `${catalogPath}.${randomUUID()}.tmp`;
    await writeNew(temporaryCatalog, `${JSON.stringify(catalog, null, 2)}\n`, 0o644);
    await rename(temporaryCatalog, catalogPath);
  } catch (error) {
    // Roll back only files created by this invocation. Never delete a preexisting
    // file or recursively remove directories another process may be using.
    const cleanup = await Promise.allSettled(createdFiles.map(path => unlink(path)));
    const incomplete = cleanup.some(result => result.status === 'rejected' && result.reason.code !== 'ENOENT');
    if (incomplete) fail('Preparation failed and some new output files could not be removed. Inspect the output directories before retrying.');
    throw error;
  }
  console.log(`Prepared ${documents.length} encrypted documents.`);
  console.log(`Public encrypted assets: ${assetDirectory}`);
  console.log(`Public metadata: ${catalogPath}`);
  for (const name of PRIVATE_FILES) console.log(`Private file: ${join(options.privateOutput, name)}`);
}

main().catch(error => {
  console.error(`Document preparation failed: ${error.message}`);
  process.exitCode = 1;
});
