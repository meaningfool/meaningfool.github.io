#!/usr/bin/env node
import { lstat, mkdir, open, readFile, realpath, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocumentGrant, createPortfolioUrl } from '../src/lib/document-grants.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
const baseUrl = 'https://meaningfool.net';
const fail = message => { throw new Error(message); };
const within = (root, path) => { const part = relative(root, path); return !part || (!isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`)); };
async function exists(path) {
  try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
async function canonical(path) {
  try { return await realpath(path); } catch (error) {
    if (error.code !== 'ENOENT' || await exists(path) || dirname(path) === path) throw error;
    return join(await canonical(dirname(path)), relative(dirname(path), path));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const usage = 'Usage: node scripts/create-portfolio-links.mjs --keys /absolute/document-share-keys.json --output /absolute/private-directory';
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { console.log(usage); return; }
  if (args.length !== 4) fail(usage);
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--keys', '--output'].includes(args[index]) || options[args[index]] || !isAbsolute(args[index + 1])) fail(usage);
    options[args[index]] = resolve(args[index + 1]);
  }
  if (!options['--keys'] || !options['--output']) fail(usage);
  if (Number(process.versions.node.split('.')[0]) < 20 || !globalThis.crypto?.subtle) fail('Node.js 20 or later with Web Crypto is required.');

  let data;
  try { data = JSON.parse(await readFile(options['--keys'], 'utf8')); }
  catch (error) { if (error instanceof SyntaxError) fail('The keys file must contain valid JSON.'); throw error; }
  if (data?.version !== 1 || data.baseUrl !== baseUrl || !Array.isArray(data.documents) || data.documents.length !== 4) fail('Expected a version 1 keys file for meaningfool.net containing four documents.');
  const seen = new Set();
  for (const doc of data.documents) {
    if (!doc || typeof doc.id !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(doc.id) || seen.has(doc.id) ||
        typeof doc.title !== 'string' || !doc.title.trim() || typeof doc.key !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(doc.key) ||
        Buffer.from(doc.key, 'base64url').toString('base64url') !== doc.key) fail('The keys file contains an invalid or duplicate document.');
    seen.add(doc.id);
  }
  const scope = JSON.parse(await readFile(join(repository, 'src/data/portfolio-scope.json'), 'utf8'));
  if (!Array.isArray(scope) || scope.length !== seen.size || scope.some(id => !seen.has(id))) fail('The keys file must match the full public portfolio scope.');
  const output = options['--output'];
  const root = await realpath(repository);
  if (within(resolve(repository), output) || within(root, await canonical(output))) fail('Private output must be outside the repository, including dist and symlinked paths into the repository.');
  const privatePaths = ['portfolio-links.json', 'portfolio-links.txt'].map(name => join(output, name));
  for (const path of privatePaths) if (await exists(path)) fail(`Refusing to overwrite private output: ${path}`);
  const publicDirectory = join(repository, 'public/document-grants');
  if (!within(root, await canonical(publicDirectory))) fail('The public grants directory must resolve inside the repository.');

  const selections = Array.from({ length: 15 }, (_, index) => data.documents.filter((_, bit) => (index + 1) & (1 << bit)));
  selections.sort((left, right) => right.length - left.length);
  const grant = await createDocumentGrant(data.documents.map(({ id, key }) => ({ id, key })));
  if (!/^[a-f0-9]{64}\.bin$/.test(grant.filename)) fail('The grant generator returned an invalid filename.');
  const grantPath = join(publicDirectory, grant.filename);
  if (await exists(grantPath)) fail('Refusing to overwrite an existing encrypted grant.');
  const links = selections.map(selected => ({ ids: selected.map(doc => doc.id), titles: selected.map(doc => doc.title), token: grant.token, url: createPortfolioUrl(baseUrl, selected, grant.token) }));
  const text = ['PORTFOLIO SHARING LINKS', 'Keep this file private. Every link uses the same token and grants access to all four documents. The document names only choose what is displayed.', ''];
  for (const count of [4, 3, 2, 1]) {
    text.push(`${count} DOCUMENT${count === 1 ? '' : 'S'}`, '');
    for (const link of links.filter(item => item.ids.length === count)) text.push(link.titles.join(' + '), link.url, '');
  }
  const created = [];
  async function writeNew(path, contents, mode) {
    const handle = await open(path, 'wx', mode);
    created.push(path);
    try { await handle.writeFile(contents); await handle.chmod(mode); } finally { await handle.close(); }
  }
  try {
    await mkdir(output, { recursive: true, mode: 0o700 });
    await mkdir(publicDirectory, { recursive: true });
    await writeNew(privatePaths[0], `${JSON.stringify({ version: 1, links }, null, 2)}\n`, 0o600);
    await writeNew(privatePaths[1], `${text.join('\n')}\n`, 0o600);
    await writeNew(grantPath, grant.encrypted, 0o644);
  } catch (error) {
    const cleanup = await Promise.allSettled(created.map(path => unlink(path)));
    if (cleanup.some(result => result.status === 'rejected' && result.reason.code !== 'ENOENT')) fail('Creation failed; some new output files could not be removed. Inspect the output directories before retrying.');
    throw error;
  }
  console.log(`Created ${links.length} display selections using one portfolio token.`);
  console.log(`Public encrypted grant: ${grantPath}`);
  for (const path of privatePaths) console.log(`Private links file: ${path}`);
}

main().catch(error => { console.error(`Link creation failed: ${error.message}`); process.exitCode = 1; });
