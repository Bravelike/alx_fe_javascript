
const STORAGE_KEY = "dq_quotes_v1";

const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");
const showAllBtn = document.getElementById("showAll");
const quoteDisplay = document.getElementById("quoteDisplay");
const formContainer = document.getElementById("formContainer");
const allQuotesList = document.getElementById("allQuotesList");

const SAMPLE_QUOTES = [
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein", category: "Inspiration" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Inspiration" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", category: "Productivity" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt", category: "Motivation" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle", category: "Philosophy" }
];

function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_QUOTES));
      return [...SAMPLE_QUOTES];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const arr = typeof parsed === "object" ? [parsed] : SAMPLE_QUOTES;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return arr;
    }
    return parsed;
  } catch (e) {
    console.error("Failed to load quotes, using sample.", e);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_QUOTES));
    return [...SAMPLE_QUOTES];
  }
}

function saveQuotes(quotes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function getCategories(quotes) {
  const set = new Set();
  quotes.forEach(q => set.add(q.category || "Uncategorized"));
  return Array.from(set).sort();
}

function showRandomQuote() {
  const quotes = loadQuotes();
  const selectedCategory = categorySelect.value;
  const filtered = quotes.filter(q => (selectedCategory === "All") ? true : q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<span class="muted">No quotes found for category "${selectedCategory}".</span>`;
    return;
  }

  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  renderSingleQuote(pick);
}

function createAddQuoteForm() {
  formContainer.innerHTML = "";

  const form = document.createElement("form");

  const inputQuote = document.createElement("input");
  inputQuote.type = "text";
  inputQuote.placeholder = "Enter a new quote (text)";
  inputQuote.id = "newQuoteText";
  inputQuote.style.width = "60%";
  inputQuote.required = true;

  const inputAuthor = document.createElement("input");
  inputAuthor.type = "text";
  inputAuthor.placeholder = "Author (optional)";
  inputAuthor.id = "newQuoteAuthor";
  inputAuthor.style.width = "30%";

  const categoryExisting = document.createElement("select");
  categoryExisting.id = "existingCategory";
  categoryExisting.style.marginLeft = "8px";

  const currentCategories = getCategories(loadQuotes());
  const chooseExisting = document.createElement("option");
  chooseExisting.value = "";
  chooseExisting.textContent = "Choose category (or add new)";
  categoryExisting.appendChild(chooseExisting);
  currentCategories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryExisting.appendChild(opt);
  });

  const inputNewCategory = document.createElement("input");
  inputNewCategory.type = "text";
  inputNewCategory.placeholder = "Or add new category";
  inputNewCategory.id = "newQuoteCategory";
  inputNewCategory.style.marginLeft = "8px";

  const addBtn = document.createElement("button");
  addBtn.type = "submit";
  addBtn.textContent = "Add Quote";
  addBtn.style.marginLeft = "8px";

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "8px";
  wrapper.style.alignItems = "center";
  wrapper.style.marginTop = "8px";
  wrapper.appendChild(inputQuote);
  wrapper.appendChild(inputAuthor);
  wrapper.appendChild(categoryExisting);
  wrapper.appendChild(inputNewCategory);
  wrapper.appendChild(addBtn);

  form.appendChild(wrapper);
  formContainer.appendChild(form);

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    const text = inputQuote.value.trim();
    const author = inputAuthor.value.trim() || "Unknown";
    const chosen = categoryExisting.value;
    const newCat = inputNewCategory.value.trim();
    let category = chosen || newCat || "Uncategorized";

    if (!text) {
      alert("Please enter a quote text.");
      return;
    }

    const quotes = loadQuotes();
    quotes.push({ text, author, category });
    saveQuotes(quotes);

    populateCategoryOptions();
    displayAllQuotes();           
    renderSingleQuote({ text, author, category }); 
    inputQuote.value = "";
    inputAuthor.value = "";
    inputNewCategory.value = "";
    categoryExisting.value = "";
  });
}

function renderSingleQuote(q) {
  quoteDisplay.innerHTML = ""; 
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.gap = "6px";

  const textEl = document.createElement("div");
  textEl.textContent = `"${q.text}"`;
  textEl.style.fontSize = "1.1rem";
  textEl.style.fontWeight = "600";
  textEl.style.lineHeight = "1.2";
  textEl.style.maxWidth = "720px";
  textEl.style.wordBreak = "break-word";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `— ${q.author} <span style="margin-left:10px;color:#6b7280">(${q.category || "Uncategorized"})</span>`;

  container.appendChild(textEl);
  container.appendChild(meta);
  quoteDisplay.appendChild(container);
}

function populateCategoryOptions() {
  const quotes = loadQuotes();
  const cats = getCategories(quotes);
  categorySelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All";
  categorySelect.appendChild(allOpt);

  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function displayAllQuotes() {
  allQuotesList.innerHTML = "";
  const quotes = loadQuotes();
  if (!quotes || quotes.length === 0) {
    allQuotesList.innerHTML = `<p class="muted">No saved quotes.</p>`;
    return;
  }

  quotes.forEach((q, idx) => {
    const item = document.createElement("div");
    item.className = "quote-item";
    const text = document.createElement("div");
    text.innerHTML = `<div style="font-weight:600">"${q.text}"</div><div class="small">— ${q.author} <span style="margin-left:8px">(${q.category})</span></div>`;

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.gap = "6px";
    // delete button
    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      const arr = loadQuotes();
      arr.splice(idx, 1);
      saveQuotes(arr);
      populateCategoryOptions();
      displayAllQuotes();
      // update main area if the deleted quote is currently shown - optional
      quoteDisplay.innerHTML = `<div class="muted">Quote deleted.</div>`;
    });
    buttons.appendChild(del);

    item.appendChild(text);
    item.appendChild(buttons);
    allQuotesList.appendChild(item);
  });
}

function init() {
  populateCategoryOptions();
  createAddQuoteForm();
  displayAllQuotes();

  newQuoteBtn.addEventListener("click", showRandomQuote);
  showAllBtn.addEventListener("click", displayAllQuotes);

  categorySelect.addEventListener("change", () => {
    showRandomQuote();
  });

  showRandomQuote();
}

// Run
init();
