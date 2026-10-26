import documents from '../data/shared-documents.json';
import { decryptPdf, parseShareFragment } from '../lib/shared-documents.mjs';

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
const count = element('document-count');
const title = element('document-title');
const details = element('document-details');
const actions = element('document-actions');
const openLink = element<HTMLAnchorElement>('open-document');
const downloadLink = element<HTMLAnchorElement>('download-document');
const frame = element<HTMLIFrameElement>('pdf-frame');
const status = element('document-status');
const statusTitle = element('status-title');
const statusDetail = element('status-detail');
const spinner = element('loading-indicator');
const retry = element<HTMLButtonElement>('retry-document');
const hint = element('preview-hint');
const message = element('share-message');
const messageTitle = element('share-message-title');
const messageDetail = element('share-message-detail');

let shared: SharedDocument[] = [];
let activeId: string | null = null;
let currentFragment: string | null = null;
let generation = 0;
let request = 0;
let abort: AbortController | undefined;
const objectUrls = new Map<string, string>();

function clearPreview() {
  frame.hidden = true;
  frame.removeAttribute('src');
  actions.hidden = true;
  hint.hidden = true;
  openLink.removeAttribute('href');
  downloadLink.removeAttribute('href');
  downloadLink.removeAttribute('download');
}

function releaseDocuments() {
  generation += 1;
  request += 1;
  abort?.abort();
  clearPreview();
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
  activeId = null;
}

function showMessage(heading: string, detail: string) {
  shell.hidden = true;
  count.hidden = true;
  messageTitle.textContent = heading;
  messageDetail.textContent = detail;
  message.hidden = false;
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
  frame.src = `${url}#view=FitH`;
  frame.hidden = false;
  openLink.href = url;
  downloadLink.href = url;
  downloadLink.download = doc.filename;
  actions.hidden = false;
  hint.hidden = false;
  status.hidden = true;
  panel.setAttribute('aria-busy', 'false');
}

function describeDocument(doc: SharedDocument) {
  const size = doc.bytes < 1_000_000
    ? `${Math.max(1, Math.round(doc.bytes / 1000))} KB`
    : `${(doc.bytes / 1_000_000).toFixed(1)} MB`;
  return `PDF · ${doc.pages} ${doc.pages === 1 ? 'page' : 'pages'} · ${size}`;
}

async function selectDocument(id: string, updateLocation = true) {
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
  title.textContent = doc.title;
  details.textContent = describeDocument(doc);
  showLoading();

  if (updateLocation) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', doc.id);
    history.replaceState(null, '', url);
  }

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

function refreshFromLocation() {
  if (currentFragment !== window.location.hash) {
    releaseDocuments();
    shared = [];
    tabs.replaceChildren();
    currentFragment = window.location.hash;

    try {
      shared = parseShareFragment(currentFragment, documents) as SharedDocument[];
    } catch {
      showMessage('This link is incomplete or no longer works', 'Use the complete link Josselin shared with you, or ask him for a new one.');
      return;
    }

    if (!shared.length) {
      showMessage('You’ll need a shared link', 'Use the complete link Josselin shared with you to open your documents.');
      return;
    }
    if (!window.crypto?.subtle) {
      showMessage('This browser can’t open the documents', 'Open the complete link in a current version of Safari, Chrome, Firefox, or Edge.');
      return;
    }

    renderTabs();
    count.textContent = `${shared.length} ${shared.length === 1 ? 'document' : 'documents'}`;
    count.hidden = false;
    message.hidden = true;
    shell.hidden = false;
  }

  if (!shared.length) return;
  const requested = new URL(window.location.href).searchParams.get('tab');
  const initial = shared.find((doc) => doc.id === requested) ?? shared[0];
  void selectDocument(initial.id, false);
}

retry.addEventListener('click', () => {
  const id = activeId;
  activeId = null;
  if (id) void selectDocument(id, false);
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
