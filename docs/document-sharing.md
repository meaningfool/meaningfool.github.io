# Sharing documents

Share a link whose query names the selected PDFs and whose fragment contains one access token:

```text
https://meaningfool.net/documents/?documents=ai-portfolio,pm-methodologies-portfolio#<token>
```

The **same token grants access to all four documents**. The `documents` query is a display selector, not an access restriction. Anyone with the token can edit, remove or reorder the comma-separated names while retaining `#token` to show any selection in their chosen tab order.

Omitting the entire `documents` parameter shows all four PDFs: `https://meaningfool.net/documents/#<token>`. An explicitly empty list or an unknown document name shows a 404 view.

The page displays the selected PDFs in tabs using the browser's native PDF viewer. It requests a closed thumbnail sidebar with `navpanes=0` and `pagemode=none`, keeps the native toolbar, and fits the page width. Support for PDF display parameters varies between browsers.

## Create all sharing links

The four PDFs are already encrypted individually. Keep their existing `document-share-keys.json` outside the repository. With Node.js 20 or later, run from the repository root:

```sh
node scripts/create-portfolio-links.mjs \
  --keys /absolute/private/document-share-keys.json \
  --output /absolute/private/portfolio-links
```

The script validates the existing keys against `src/data/portfolio-scope.json`, creates **one full-portfolio encrypted grant**, and produces all **15 nonempty display selections** using its one fresh token. No original PDF is re-encrypted, and no existing document key changes. To edit an existing link's display selection, just change its query; rerunning this command is unnecessary.

Open the resulting private `portfolio-links.txt`, find the desired selection, and copy its URL. The all-document link appears first, followed by groups of three, two and one. No HTML builder or editing tool is needed.

## Public and private files

The script adds one encrypted grant file to the website:

```text
public/document-grants/<sha256-of-token>.bin
```

The grant contains all four document keys in encrypted form. Its filename is a hash of the random token, not the token itself. Existing encrypted PDFs in `public/shared-documents/` and their public metadata remain unchanged. The encrypted assets, public portfolio scope and viewer source can be committed and deployed through the site's normal GitHub Pages process. No backend server is required.

The following outputs stay in the external private directory, with filesystem mode `0600`:

- `portfolio-links.txt`: the ready-to-copy list, ordered by selection size.
- `portfolio-links.json`: the same selections with their names, shared token and URLs.

The script refuses to overwrite either private output. Use a fresh output directory to generate another set. It also rejects output inside the repository or `dist`, including paths that resolve there through symlinks. Terminal output contains only counts and safe file paths, never tokens or full links.

Never commit or deploy these private files, `document-share-keys.json`, or original PDFs. Keep them outside the checkout and build directory. File permissions do not encrypt their contents on disk, so protect backups and shared or synced locations too. Document names and metadata are public; PDF contents and document keys are encrypted.

## Publish and check

Review the changes and run the site's normal build before deployment:

```sh
git status --short
npm run build
```

Deploy the encrypted grant with the viewer, then verify that the same token works with a one-document query, multiple names in a different order, and no `documents` parameter. Confirm that the tabs show the named PDFs in query order and default to all four when the parameter is absent.

A missing or invalid token displays a client-side 404 view. The initial HTTP response still has status 200 on GitHub Pages: the token is in the fragment and is never sent to the server, so a static host cannot check it before serving the page.

Anyone with a current portfolio link can view, save and forward all four documents, regardless of its current query. The token remains available to page JavaScript, browser history and anyone who receives the full link. Keep the viewer free of third-party scripts that should not receive it.

Generating a new portfolio token does not revoke old ones. Existing legacy links remain valid; older grants issued for a narrower selection retain their original selection binding. Removing a grant cannot retract downloaded grants, PDFs or keys, and encrypted files may remain in caches or public Git history. Access depends on possession of a link, without recipient identity checks.

The original `scripts/prepare-document-share.mjs` remains available for deliberately preparing or rotating the underlying encrypted PDFs. Re-encrypting those PDFs creates fresh document keys and requires new grants and links. Keep old assets and their matching keys together; replacing live encrypted PDFs cannot retract earlier copies.
