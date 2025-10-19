// script.js
// Sync + conflict-resolution added for Dynamic Quote Generator
// Uses JSONPlaceholder as a mock server (GET /posts, POST /posts, etc).
// JSONPlaceholder docs: https://jsonplaceholder.typicode.com/guide/ . :contentReference[oaicite:2]{index=2}

/* ---------------- CONFIG & STORAGE KEYS ---------------- */
const LOCAL_STORAGE_KEY = 'dynamicQuoteGenerator.quotes';
const LOCAL_FILTER_KEY = 'dynamicQuoteGenerator.lastFilter';
const SESSION_LAST_VIEWED = 'dynamicQuoteGenerator.lastViewedQuote';

// Server settings (user-editable in UI)
let SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // default mock server
let AUTO_SYNC_INTERVAL_SECONDS = 30; // default; adjustable via UI

/* ---------------- IN-MEMORY STATE ----------------
 We keep quotes as objects with optional metadata:
 {
   id?: local id (string generated locally),
   serverId?: number (ID on server),
   text: string,
   category: string,
   updatedAt: ISO timestamp (last modified locally),
 }
*/
let quotes = [];

/* ---------------- DEFAULTS ---------------- */
const defaultQuotes = [
  { id: generateLocalId(), text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation", updatedAt: new Date().toISOString() },
  { id: generateLocalId(), text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: new Date().toISOString() },
  { id: generateLocalId(), text: "Do what you can, with what you have, where you are.", category: "Action", updatedAt: new Date().toISOString() }
];

/* ---------------- UTILITIES ---------------- */
function generateLocalId() {
  return 'local-' + Math.random().toString(36).slice(2, 9);
}
function nowIso() { return new Date().toISOString(); }

/* ---------------- PERSISTENCE ---------------- */
function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    quotes = defaultQuotes.slice();
    saveQuotes();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      quotes = parsed;
    } else {
      quotes = defaultQuotes.slice();
      saveQuotes();
    }
  } catch (err) {
    console.warn('Failed to parse saved quotes, resetting to defaults', err);
    quotes = defaultQuotes.slice();
    saveQuotes();
  }
}

/* ---------------- UI: Category & Display ---------------- */
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  select.innerHTML = '<option value="all">All Categories</option>';
  const categories = [...new Set(quotes.map(q => q.category || 'Uncategorized'))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  const lastFilter = localStorage.getItem(LOCAL_FILTER_KEY);
  if (lastFilter) {
    select.value = lastFilter;
  }
}

/* ---------------- GLOBAL STATE ---------------- */
let selectedCategory = 'all'; // <-- add this line near top (after other globals)

/* ---------------- FILTERING ---------------- */
function filterQuotes() {
  const select = document.getElementById('categoryFilter');
  selectedCategory = select?.value || 'all'; // <-- store globally
  localStorage.setItem(LOCAL_FILTER_KEY, selectedCategory);

  const display = document.getElementById('quoteDisplay');
  display.innerHTML = '';

  const filtered = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    display.textContent = `No quotes found for category "${selectedCategory}".`;
    return;
  }

  filtered.forEach(q => {
    const container = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = q.text;
    p.style.fontStyle = 'italic';
    const small = document.createElement('small');
    small.textContent = `Category: ${q.category} ${q.serverId ? `(serverId:${q.serverId})` : ''}`;
    container.appendChild(p);
    container.appendChild(small);
    container.style.marginBottom = '8px';
    display.appendChild(container);
  });
}


function showRandomQuote() {
  const display = document.getElementById('quoteDisplay');
  if (!display) return;
  const currentFilter = document.getElementById('categoryFilter')?.value || 'all';
  const filtered = currentFilter === 'all' ? quotes : quotes.filter(q => q.category === currentFilter);
  if (filtered.length === 0) {
    display.textContent = `No quotes available for category "${currentFilter}".`;
    return;
  }
  const q = filtered[Math.floor(Math.random() * filtered.length)];
  display.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = q.text;
  p.style.fontStyle = 'italic';
  const small = document.createElement('small');
  small.textContent = `Category: ${q.category} ${q.serverId ? `(serverId:${q.serverId})` : ''}`;
  display.appendChild(p);
  display.appendChild(small);

  try { sessionStorage.setItem(SESSION_LAST_VIEWED, JSON.stringify(q)); } catch(e) {}
}

/* ---------------- ADD / IMPORT / EXPORT ---------------- */
function createAddQuoteForm() {
  const container = document.getElementById('addQuoteContainer');
  if (!container) return;
  const wrapper = document.createElement('div');

  const inputText = document.createElement('input');
  inputText.id = 'newQuoteText';
  inputText.type = 'text';
  inputText.placeholder = 'Enter a new quote';
  inputText.style.marginRight = '8px';

  const inputCategory = document.createElement('input');
  inputCategory.id = 'newQuoteCategory';
  inputCategory.type = 'text';
  inputCategory.placeholder = 'Enter quote category';
  inputCategory.style.marginRight = '8px';

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = 'Add Quote';
  addBtn.onclick = addQuote;

  wrapper.appendChild(inputText);
  wrapper.appendChild(inputCategory);
  wrapper.appendChild(addBtn);
  container.appendChild(wrapper);
}

function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  if (!textInput) return;
  const text = textInput.value.trim();
  const category = (catInput && catInput.value.trim()) || 'Uncategorized';
  if (!text) { alert('Please enter a quote before adding.'); return; }

  const item = { id: generateLocalId(), text, category, updatedAt: nowIso() };
  quotes.push(item);
  saveQuotes();

  textInput.value = '';
  if (catInput) catInput.value = '';

  // update UI
  populateCategories();
  filterQuotes();
}

/* export/import unchanged */
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) { alert('Invalid file format.'); return; }
      const valid = imported.filter(q => q.text && typeof q.text === 'string')
        .map(q => ({ id: q.id || generateLocalId(), serverId: q.serverId, text: q.text.trim(), category: q.category || 'Uncategorized', updatedAt: q.updatedAt || nowIso() }));
      quotes.push(...valid);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert('Quotes imported successfully!');
    } catch (err) {
      alert('Failed to import JSON file.');
      console.error(err);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

/* ---------------- SERVER SYNC & CONFLICTS ----------------
 Strategy:
  - Periodically GET the server resource list (here we use JSONPlaceholder /posts).
  - Map server items to our quote schema: server 'id' => serverId, 'body' => text, 'title' => category.
  - Merge:
      * If local item has serverId and server has same serverId:
          - If timestamps differ (server considered authoritative), replace local with server copy (server wins).
          - Mark such occurrences as "resolved conflicts" and notify user.
      * If server item has no matching local item (new on server) -> add to local (server wins).
      * If local items have no serverId (local-only) -> optionally POST to server (we attempt POST; JSONPlaceholder fakes this).
  - UI shows a notification when changes were applied; conflicts can be inspected & manual override applied.
*/

let autoSyncTimerId = null;
let pendingConflicts = []; // { local, server, actionPending }

async function fetchServerQuotes() {
  const url = SERVER_URL;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Network error: ' + resp.status);
    const data = await resp.json();
    // JSONPlaceholder /posts returns objects like { id, title, body, userId }
    // Map them to: { serverId:id, text: body, category: title, updatedAt: now }
    const mapped = (Array.isArray(data) ? data : []).map(item => ({
      serverId: item.id,
      text: typeof item.body === 'string' ? item.body : String(item.body || ''),
      category: typeof item.title === 'string' ? item.title : 'Uncategorized',
      updatedAt: nowIso()
    }));
    return mapped;
  } catch (err) {
    console.warn('Failed to fetch server quotes:', err);
    return null;
  }
}

/**
 * Merge server data into local quotes.
 * Conflict detection: local.serverId === server.serverId but text/category differ.
 * Server wins automatically, but we record each conflict for UI (so user can inspect & optionally revert).
 */
async function syncWithServer() {
  const serverList = await fetchServerQuotes();
  if (!serverList) {
    showNotification('Auto-sync failed: could not reach server.', true);
    return;
  }

  const serverById = new Map(serverList.map(s => [s.serverId, s]));
  const localByServerId = new Map(quotes.filter(q => q.serverId).map(q => [q.serverId, q]));

  const newLocalItems = [];
  const conflictsFound = [];

  // 1) Apply server items: add new server items locally and replace local copies if different
  for (const s of serverList) {
    const localMatch = localByServerId.get(s.serverId);
    if (localMatch) {
      // compare content
      if (localMatch.text !== s.text || localMatch.category !== s.category) {
        // conflict detected; server wins: replace local but keep local id
        const oldLocal = { ...localMatch };
        localMatch.text = s.text;
        localMatch.category = s.category;
        localMatch.updatedAt = nowIso();
        // record conflict so user can inspect/revert if they want
        conflictsFound.push({ local: oldLocal, server: { ...s } });
      }
      // else identical -> nothing
    } else {
      // server item not present locally -> add it (server wins)
      const newItem = { id: generateLocalId(), serverId: s.serverId, text: s.text, category: s.category, updatedAt: nowIso() };
      newLocalItems.push(newItem);
    }
  }

  // 2) Handle local-only items (no serverId): attempt to POST to server to create them remotely
  // Note: JSONPlaceholder fakes POSTs; in a real server you'd get back a created resource with id.
  const localOnly = quotes.filter(q => !q.serverId);
  for (const localItem of localOnly) {
    try {
      const resp = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json; charset=UTF-8' },
        body: JSON.stringify({ title: localItem.category, body: localItem.text })
      });
      if (resp.ok) {
        const created = await resp.json(); // fake response with an id
        // attach serverId to local item so future syncs can match
        localItem.serverId = created.id;
        localItem.updatedAt = nowIso();
      } else {
        console.warn('Failed to POST local item to server:', resp.status);
      }
    } catch (err) {
      console.warn('Error POSTing local item to server:', err);
    }
  }

  // 3) Add new server-only items to local array
  if (newLocalItems.length) {
    quotes.push(...newLocalItems);
  }

  // 4) If any conflicts found, record them and notify user
  if (conflictsFound.length > 0) {
    // save pending conflicts for UI
    pendingConflicts = conflictsFound.map(c => ({ ...c, resolved: false }));
    saveQuotes();
    populateCategories();
    filterQuotes();
    showNotification(`${conflictsFound.length} conflict(s) detected and resolved (server changes applied). ` +
                     `You can review/rescind these changes.`, false, true);
  } else if (newLocalItems.length > 0) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    showNotification(`${newLocalItems.length} new quote(s) added from server.`, false);
  } else {
    // no changes
    // still save to ensure any serverId attachments are persisted
    saveQuotes();
    // small notification optional: we keep silent to avoid noise
  }
}

/* ---------------- NOTIFICATION & CONFLICT UI ---------------- */
function showNotification(message, isError=false, showReviewButton=false) {
  const n = document.getElementById('notification');
  n.style.display = 'block';
  n.style.background = isError ? '#fff0f0' : '#f0f4ff';
  n.textContent = message;
  if (showReviewButton) {
    const btn = document.createElement('button');
    btn.textContent = 'Review Conflicts';
    btn.style.marginLeft = '12px';
    btn.onclick = () => openConflictsModal();
    n.appendChild(btn);
  }
  // auto-hide after some seconds for non-error messages
  if (!isError) {
    setTimeout(() => { if (n) n.style.display = 'none'; }, 8000);
  }
}

function openConflictsModal() {
  const modal = document.getElementById('conflictsModal');
  const list = document.getElementById('conflictList');
  list.innerHTML = '';
  if (!pendingConflicts || pendingConflicts.length === 0) {
    list.textContent = 'No pending conflicts.';
  } else {
    pendingConflicts.forEach((c, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'conflict-item';
      const header = document.createElement('div');
      header.innerHTML = `<strong>Conflict #${idx+1}</strong> (serverId: ${c.server.serverId})`;
      const localDiv = document.createElement('div');
      localDiv.innerHTML = `<em>Local (before):</em> ${escapeHtml(c.local.text)} <br/><small>Category: ${escapeHtml(c.local.category)}</small>`;
      const serverDiv = document.createElement('div');
      serverDiv.innerHTML = `<em>Server (applied):</em> ${escapeHtml(c.server.text)} <br/><small>Category: ${escapeHtml(c.server.category)}</small>`;
      const btns = document.createElement('div');
      btns.className = 'conflict-buttons';
      const keepServerBtn = document.createElement('button');
      keepServerBtn.textContent = 'Keep Server (already applied)';
      keepServerBtn.disabled = true; // server already applied by default
      const revertBtn = document.createElement('button');
      revertBtn.textContent = 'Revert to Local';
      revertBtn.onclick = () => {
        // find local record by local.id and revert its fields to the saved 'local' snapshot
        const target = quotes.find(q => q.id === c.local.id);
        if (target) {
          target.text = c.local.text;
          target.category = c.local.category;
          target.updatedAt = nowIso();
          // clear serverId if local previously had none? We keep serverId (user can decide)
          saveQuotes();
          populateCategories();
          filterQuotes();
          // mark resolved and remove from pending list
          c.resolved = true;
          wrapper.style.opacity = '0.6';
          alert('Reverted to local version for that conflict.');
        } else {
          alert('Local item not found — cannot revert.');
        }
      };
      btns.appendChild(keepServerBtn);
      btns.appendChild(revertBtn);

      wrapper.appendChild(header);
      wrapper.appendChild(localDiv);
      wrapper.appendChild(serverDiv);
      wrapper.appendChild(btns);
      list.appendChild(wrapper);
    });
  }
  modal.style.display = 'block';
}

document.getElementById('closeConflicts')?.addEventListener?.('click', () => {
  document.getElementById('conflictsModal').style.display = 'none';
});

/* ---------------- SYNC SCHEDULER ---------------- */
function startAutoSync() {
  stopAutoSync();
  autoSyncTimerId = setInterval(() => {
    syncWithServer();
  }, Math.max(5000, AUTO_SYNC_INTERVAL_SECONDS * 1000));
}
function stopAutoSync() {
  if (autoSyncTimerId) {
    clearInterval(autoSyncTimerId);
    autoSyncTimerId = null;
  }
}

/* ---------------- HELPERS ---------------- */
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ---------------- UI HOOKS FOR SERVER SETTINGS ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Load persisted data
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  // Wire buttons
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('exportJson').addEventListener('click', exportToJson);
  document.getElementById('manualSync').addEventListener('click', async () => {
    SERVER_URL = document.getElementById('serverUrl').value.trim() || SERVER_URL;
    await syncWithServer();
    alert('Manual sync completed (see notifications).');
  });
  document.getElementById('applySyncSettings').addEventListener('click', () => {
    const val = parseInt(document.getElementById('syncInterval').value, 10);
    if (!isNaN(val) && val >= 5) {
      AUTO_SYNC_INTERVAL_SECONDS = val;
      SERVER_URL = document.getElementById('serverUrl').value.trim() || SERVER_URL;
      startAutoSync();
      alert('Sync settings applied.');
    } else {
      alert('Sync interval must be a number >= 5 seconds.');
    }
  });

  // Restore filter and display initial content
  const savedFilter = localStorage.getItem(LOCAL_FILTER_KEY);
  if (savedFilter) {
    const sel = document.getElementById('categoryFilter');
    if (sel) sel.value = savedFilter;
  }
  filterQuotes();

  // Start auto-sync with server
  startAutoSync();
});
