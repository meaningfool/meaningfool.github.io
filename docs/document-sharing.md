# Sharing documents

Share a link whose query names the selected PDFs and whose fragment contains one access token:

```text
https://meaningfool.net/documents/?documents=ai-portfolio,pm-methodologies-portfolio#<token>
```

The token is bound to that document selection. Adding another name to the query does not grant access to it. Names stay readable so you can tell which documents a link includes.

The page displays the selected PDFs in tabs using the browser's native PDF viewer. It requests a closed thumbnail sidebar with `navpanes=0` and `pagemode=none`, keeps the native toolbar, and fits the page width. Support for PDF display parameters varies between browsers.

## Create all sharing links

The four PDFs are already encrypted individually. Keep their existing `document-share-keys.json` outside the repository. With Node.js 20 or later, run from the repository root:

```sh
node scripts/create-portfolio-links.mjs \
  --keys /absolute/private/document-share-keys.json \
  --output /absolute/private/portfolio-links
```

The script validates the existing key file and creates all **15 nonempty selections** of the four documents: one selection of four, four selections of three, six selections of two, and four selections of one. Every selection receives a fresh token and encryption nonce. No original PDF is re-encrypted, and no existing document key changes. Legacy links remain valid.

Open the resulting private `portfolio-links.txt`, find the desired selection, and copy its URL. The all-document link appears first, followed by groups of three, two and one. No HTML builder or editing tool is needed.

## Public and private files

The script adds only encrypted grant files to the website:

```text
public/document-grants/<sha256-of-token>.bin
```

Each grant contains the selected document keys in encrypted form. Its filename is a hash of the random token, not the token itself. Existing encrypted PDFs in `public/shared-documents/` and their public metadata remain unchanged. These encrypted assets and the viewer's source code can be committed and deployed through the site's normal GitHub Pages process. No backend server is required.

The following outputs stay in the external private directory, with filesystem mode `0600`:

- `portfolio-links.txt`: the ready-to-copy list, ordered by selection size.
- `portfolio-links.json`: the same selections with their names, tokens and URLs.

The script refuses to overwrite either private output. Use a fresh output directory to generate another set. It also rejects output inside the repository or `dist`, including paths that resolve there through symlinks. Terminal output contains only counts and safe file paths, never tokens or full links.

Never commit or deploy these private files, `document-share-keys.json`, or original PDFs. Keep them outside the checkout and build directory. File permissions do not encrypt their contents on disk, so protect backups and shared or synced locations too. Document names and metadata are public; PDF contents and selected keys are encrypted.

## Publish and check

Review the changes and run the site's normal build before deployment:

```sh
git status --short
npm run build
```

Deploy the new encrypted grants together with the viewer, then verify a one-document link and a multiple-document link. Confirm that the named tabs open the intended PDFs. A modified query must not let a token access an additional document.

Anyone with a link can view, save and forward its selected documents. The token follows `#`, so it is not included in the HTTP request URL, but it remains available to page JavaScript, browser history and anyone who receives the full link. Keep the viewer free of third-party scripts that should not receive it.

Generating new portfolio links does not revoke old ones. Removing a grant from the live site cannot retract previously downloaded grants, PDFs or keys; encrypted files may remain in caches or public Git history. This is limited distribution through possession of a link, without recipient identity checks.

The original `scripts/prepare-document-share.mjs` remains available for deliberately preparing or rotating the underlying encrypted PDFs. Re-encrypting those PDFs creates fresh document keys and requires new grants and links. Keep old assets and their matching keys together; replacing live encrypted PDFs cannot retract earlier copies.
