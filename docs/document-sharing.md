# Sharing PDFs on meaningfool.net

The `/documents` page displays PDFs in tabs. Every document has a readable name in the link, such as `ai-portfolio` or `pm-methodologies-portfolio`. A link includes a separate decryption key for each selected document in its URL fragment, after `#`:

```text
https://meaningfool.net/documents#ai-portfolio=<key>&pm-methodologies-portfolio=<key>
```

The browser downloads encrypted files and decrypts only the selected documents locally. The page runs on the existing static GitHub Pages site; no server, database or sign-in is needed. Names identify the files; the randomly generated keys grant access. Adding another document name without its correct key does not grant access.

## Prepare the files once

Use Node.js 20 or later. Keep the original PDFs, input manifest and private output directory outside this repository. Run this command from the repository root, replacing the absolute paths with your local paths:

```sh
node scripts/prepare-document-share.mjs \
  --manifest /absolute/private-input/document-manifest.json \
  --private-output /absolute/private-output/document-links
```

The manifest format is:

```json
{
  "documents": [
    {
      "id": "ai-portfolio",
      "title": "AI Portfolio",
      "file": "documents/ai-portfolio.pdf",
      "pages": 2,
      "bytes": 793269,
      "sha256": "887e73496e80ea87215ecf94838e23084b7f21655e2dfdf45a799d794887da09"
    }
  ]
}
```

`file` is relative to the manifest's directory. IDs must start with a lowercase letter and contain lowercase letters, digits and single separating hyphens. Each ID must be unique. `bytes` and `sha256` must match the actual PDF; `pages` is the positive page count recorded in the manifest. PDFs may be at most 25 MiB each. The script checks every input's name, metadata, file type, byte count and SHA-256 digest before changing any output. It verifies that the input begins with the PDF signature; it does not parse the PDF to recount pages.

The script creates these public repository files:

- `public/shared-documents/<document-id>.bin`: encrypted PDF contents, with a fresh independent AES-256-GCM key and nonce for each PDF.
- `src/data/shared-documents.json`: public IDs, titles, encrypted asset paths, download filenames, original byte counts and page counts.

It creates these private files **outside the repository**:

- `document-share-keys.json`: the document names and their keys, in the format `{ "version": 1, "baseUrl": "https://meaningfool.net", "documents": [{ "id": "…", "title": "…", "key": "…" }] }`.
- `manage-document-links.html`: a self-contained local link builder containing those same keys.

Both private files receive mode `0600`, readable and writable by their filesystem owner. A newly created private directory receives mode `0700`. These permissions do not encrypt the files on disk; protect backups and avoid shared/synced locations unless you intend to share their contents. The script prints file paths and a document count, never keys or full sharing links.

Private output inside the repository, including `dist`, is rejected even through a symlink. Existing private keys or link builders are never overwritten. Existing encrypted `.bin` assets also cause the command to stop, so running it twice cannot silently rotate keys. Input validation, output checks and encryption finish before any directories are created. If an ordinary write fails, the script attempts to remove only the new files it created; newly created empty directories may remain.

## Make a sharing link

Open the private `manage-document-links.html` file directly in your browser. All documents are selected initially. Uncheck any documents you do not want to share, then choose **Copy link**. The readable names in the generated URL show exactly which documents it includes. **Open selection** opens that link on meaningfool.net. With no documents selected, both actions are disabled.

The builder has no external scripts, styles, fonts, analytics or automatic network requests. It uses a restrictive Content Security Policy permitting only its own hashed inline script and stylesheet. Opening a selection deliberately navigates to the public website. Keep the builder itself private: it contains access links to all documents. Send recipients only the generated link for their selection.

Back up both private files securely. If you lose every copy of a document's key and its sharing links, the public encrypted asset cannot recover that key. Re-encrypting the original PDF creates a new key and requires new sharing links.

## Publish and verify

Review the repository changes and run the normal build:

```sh
git status --short
npm run build
```

Only the encrypted `.bin` files, public metadata, viewer code, packaging script and documentation belong in Git or the deployed site. Never add the original PDFs, manifest, key JSON or private HTML builder. The `.gitignore` entries for the private filenames are an additional guard, not a substitute for keeping them outside the checkout. A static site's public directory is copied into its build output, so never put private files there even if Git ignores them.

After the site's normal deployment, use the private builder to verify a link with one document and a link with several documents. Check tab names, inline viewing and opening or downloading the original PDF. A link with no valid keys must not display a decrypted PDF. Updating a query parameter or inventing a document name cannot substitute for a key.

Document titles, identifiers, filenames, page counts, approximate file sizes and encrypted files are public, including in the repository. Anyone can see which documents are offered. This design protects their contents rather than hiding the catalog. If the names themselves are sensitive, this public metadata design is unsuitable.

## Limits and deliberate rotation

A recipient can save the decrypted PDF or forward their link. The URL fragment is not sent in the HTTP request to the static host, but it is available to the viewer's JavaScript and can remain in browser history, clipboard contents or other places where the full link is copied. Keep the viewer free of third-party scripts that should not receive those keys.

There is no per-recipient or per-share revocation. Links reuse each selected document's key, so disabling one person's link while keeping another person's link working is not supported. Changing or deleting a document on the live site also cannot revoke PDFs already downloaded. Old encrypted assets can remain in public Git history or caches; anyone who retained their old keys can still decrypt those old copies.

To update the PDFs or rotate keys, do it explicitly:

1. Make a secure backup of the current private key JSON and builder. Record that existing live links will stop working when the new encrypted assets are deployed.
2. Prepare the complete intended set of source PDFs outside the repository. Update the manifest's sizes, page counts and hashes. The script rebuilds the complete catalog, so include all documents you intend to keep.
3. Deliberately remove the existing `public/shared-documents/*.bin` files from the working checkout after confirming the intended rotation. The script will not remove or overwrite them for you.
4. Run the preparation command with the updated manifest and a **new empty private output directory**. New encryption creates fresh keys for every listed document, including documents whose PDF contents did not change.
5. Review and build the resulting site, then deploy through the site's normal process. Distribute links from the new private builder. Old links cannot decrypt the new assets.

To abandon a rotation before publishing, restore the previous encrypted assets and catalog together from the same Git revision and keep using their matching private keys. Do not mix old assets with new keys. This workflow changes access to the current live files; it cannot retract earlier copies or keys already shared.
