import documents from '../data/shared-documents.json';
import portfolioScope from '../data/portfolio-scope.json';
import { decryptPdf, parseShareFragment } from '../lib/shared-documents.mjs';
import { decryptPortfolioGrant, documentGrantFilename, parsePortfolioSelection } from '../lib/document-grants.mjs';

type SharedDocument = {
  id: string;
  title: string;
  file: string;
  filename: string;
  bytes: number;
  pages: number;
  key: string;
};

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error('The document viewer could not start.');
  return found as T;
}

const shell = element('viewer-shell');
const tabs = element('document-tabs');
const panel = element('document-panel');
const frame = element<HTMLIFrameElement>('pdf-frame');
const status = element('document-status');
const statusTitle = element('status-title');
const statusDetail = element('status-detail');
const spinner = element('loading-indicator');
const retry = element<HTMLButtonElement>('retry-document');
const message = element('share-message');
const messageTitle = element('share-message-title');
const messageDetail = element('share-message-detail');

let shared: SharedDocument[] = [];
let activeId: string | null = null;
let currentFragment: string | null = null;
let generation = 0;
let request = 0;
let abort: AbortController | undefined;
let grantAbort: AbortController | undefined;
const objectUrls = new Map<string, string>();

function clearPreview() {
  frame.hidden = true;
  frame.removeAttribute('src');
}

function releaseDocuments() {
  generation += 1;
  request += 1;
  abort?.abort();
  grantAbort?.abort();
  clearPreview();
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
  activeId = null;
}

function showMessage(heading: string, detail: string) {
  shell.hidden = true;
  messageTitle.textContent = heading;
  messageDetail.textContent = detail;
  message.hidden = false;
}

function showNotFound() {
  document.documentElement.dataset.portfolioState = 'not-found';
  document.title = '404 - Page Not Found | meaningfool';
}

function showLoading() {
  clearPreview();
  panel.setAttribute('aria-busy', 'true');
  statusTitle.textContent = 'Opening document…';
  statusDetail.textContent = 'This should only take a moment.';
  spinner.hidden = false;
  retry.hidden = true;
  status.hidden = false;
}

function showDocument(doc: SharedDocument, url: string) {
  frame.title = doc.title;
  frame.src = `${url}#view=FitH&navpanes=0&pagemode=none&toolbar=1`;
  frame.hidden = false;
  status.hidden = true;
  panel.setAttribute('aria-busy', 'false');
}

async function selectDocument(id: string) {
  const doc = shared.find((item) => item.id === id);
  if (!doc || activeId === id) return;

  abort?.abort();
  const controller = new AbortController();
  abort = controller;
  const selectedGeneration = generation;
  const selectedRequest = ++request;
  activeId = doc.id;

  for (const tab of tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
    const selected = tab.dataset.document === doc.id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', `document-tab-${doc.id}`);
  showLoading();

  const cached = objectUrls.get(doc.id);
  if (cached) {
    showDocument(doc, cached);
    return;
  }

  const isCurrent = () => selectedGeneration === generation && selectedRequest === request && !controller.signal.aborted;
  try {
    const response = await fetch(doc.file, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) throw new Error('Document unavailable.');
    const encrypted = await response.arrayBuffer();
    if (!isCurrent()) return;
    const pdf = await decryptPdf(new Uint8Array(encrypted), doc.id, doc.key);
    if (!isCurrent()) return;

    // Copy into a standalone buffer for a browser PDF Blob, without storing the key.
    const bytes = new Uint8Array(pdf);
    const url = URL.createObjectURL(new Blob([bytes.buffer], { type: 'application/pdf' }));
    objectUrls.set(doc.id, url);
    showDocument(doc, url);
  } catch {
    if (!isCurrent()) return;
    panel.setAttribute('aria-busy', 'false');
    spinner.hidden = true;
    statusTitle.textContent = 'We couldn’t open this document';
    statusDetail.textContent = 'Try again, or ask Josselin for a new link if this one is incomplete or no longer works.';
    retry.hidden = false;
  }
}

function renderTabs() {
  tabs.replaceChildren();
  for (const doc of shared) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `document-tab-${doc.id}`;
    tab.className = 'document-tab';
    tab.dataset.document = doc.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'document-panel');
    tab.setAttribute('aria-selected', 'false');
    tab.tabIndex = -1;
    tab.textContent = doc.title;
    tab.addEventListener('click', () => void selectDocument(doc.id));
    tab.addEventListener('keydown', (event) => {
      const allTabs = Array.from(tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const index = allTabs.indexOf(tab);
      let next: number;
      switch (event.key) {
        case 'ArrowRight': next = (index + 1) % allTabs.length; break;
        case 'ArrowLeft': next = (index - 1 + allTabs.length) % allTabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = allTabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      const target = allTabs[next];
      target.focus();
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      void selectDocument(target.dataset.document!);
    });
    tabs.append(tab);
  }
}

async function refreshFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const identity = JSON.stringify([params.getAll('documents'), window.location.hash]);
  if (currentFragment !== identity) {
    releaseDocuments();
    shared = [];
    tabs.replaceChildren();
    currentFragment = identity;
    const token = window.location.hash.slice(1);
    if (!token) {
      showNotFound();
      return;
    }
    document.documentElement.dataset.portfolioState = 'portfolio';
    document.title = 'Portfolio · Josselin Perrus';
    const selectedGeneration = generation;
    const controller = new AbortController();
    grantAbort = controller;
    showMessage('Opening portfolio…', 'This should only take a moment.');

    try {
      if (params.has('documents') || /^[A-Za-z0-9_-]{43}$/.test(token)) {
        const ids = params.has('documents') ? parsePortfolioSelection(window.location.search, documents) : portfolioScope;
        const filename = await documentGrantFilename(token);
        if (selectedGeneration !== generation) return;
        const response = await fetch(`/document-grants/${filename}`, {
          signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
        });
        if (!response.ok) throw new Error('Portfolio unavailable.');
        const capabilities = await decryptPortfolioGrant(await response.arrayBuffer(), token, ids, documents, portfolioScope);
        if (selectedGeneration !== generation || controller.signal.aborted) return;
        shared = capabilities as SharedDocument[];
      } else {
        // Keep already-shared links working while new links use one token.
        shared = parseShareFragment(window.location.hash, documents) as SharedDocument[];
      }
    } catch {
      if (selectedGeneration !== generation || controller.signal.aborted) return;
      showNotFound();
      return;
    }

    if (!shared.length) {
      showNotFound();
      return;
    }
    if (!window.crypto?.subtle) {
      showMessage('This browser can’t open the documents', 'Open the complete link in a current version of Safari, Chrome, Firefox, or Edge.');
      return;
    }

    renderTabs();
    message.hidden = true;
    shell.hidden = false;
  }

  if (!shared.length) return;
  const requested = new URL(window.location.href).searchParams.get('tab');
  const initial = shared.find((doc) => doc.id === requested) ?? shared[0];
  void selectDocument(initial.id);
}

retry.addEventListener('click', () => {
  const id = activeId;
  activeId = null;
  if (id) void selectDocument(id);
});
element('skip-to-documents').addEventListener('click', () => element('main').focus());
window.addEventListener('hashchange', refreshFromLocation);
window.addEventListener('popstate', refreshFromLocation);
window.addEventListener('pagehide', releaseDocuments);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    currentFragment = null;
    refreshFromLocation();
  }
});

refreshFromLocation();
