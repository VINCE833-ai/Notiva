// script.js

// ====== UI ELEMENTS ======

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const newNoteBtn = document.getElementById("newNoteBtn");
const noteModal = document.getElementById("noteModal");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const saveBtn = document.querySelector(".save-btn");
const noteTitleInput = document.querySelector(".note-title");
const noteTextInput = document.querySelector(".note-text");
const notesContainer = document.getElementById("notesContainer");
const searchBar = document.querySelector(".search-bar");
const syncBtn = document.querySelector(".sync-btn");

const menuItems = document.querySelectorAll(".menu-item");

let currentView = "Notes"; // "Notes" or "Trash"
let editingNode = null;    // reference to Node being edited (if any)

// ====== Sidebar toggle ======
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
  sidebar.classList.toggle("collapsed");
});

// ====== Menu item behavior (switch views) ======
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const label = item.querySelector(".menu-title")?.textContent.trim();
    if (label === "Notes List") { currentView = "Notes"; notesList.renderNotes(); }
    else if (label === "Trash") { currentView = "Trash"; trashList.renderTrash(); }
    // other labels (Archive...) can be wired later
  });
});

// ====== Modal helpers ======
function openModal(editNode = null) {
  noteModal.classList.remove("hidden");
  if (editNode) {
    editingNode = editNode;
    noteTitleInput.value = editNode.title;
    noteTextInput.value = editNode.content;
    noteTitleInput.disabled = true; // title immutable while editing
  } else {
    editingNode = null;
    noteTitleInput.value = "";
    noteTextInput.value = "";
    noteTitleInput.disabled = false;
  }
  setTimeout(() => noteTitleInput.focus(), 0);
}

function closeModal() {
  noteModal.classList.add("hidden");
  editingNode = null;
}

// open new-note modal
newNoteBtn.addEventListener("click", () => openModal());

// modal controls
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
noteModal.addEventListener("click", (e) => {
  if (e.target === noteModal) closeModal();
});

// ====== Node & Data Structures ======
class Node {
  constructor(title, content) {
    this.title = title;
    this.content = content;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  addNode(title, content) {
    const newNode = new Node(title, content);
    if (!this.head) this.head = newNode;
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = newNode;
    }
    this.onChange?.();
  }

  removeNode(target) {
    if (!this.head) return;
    if (this.head === target) {
      this.head = this.head.next;
      this.onChange?.();
      return;
    }
    let cur = this.head;
    while (cur.next && cur.next !== target) cur = cur.next;
    if (cur.next === target) {
      cur.next = target.next;
      this.onChange?.();
    }
  }

  // helper to iterate as array of nodes (useful when serializing)
  toArray() {
    const arr = [];
    let cur = this.head;
    while (cur) {
      arr.push({ title: cur.title, content: cur.content });
      cur = cur.next;
    }
    return arr;
  }

  // rebuild from simple array of {title,content}
  fromArray(arr) {
    this.head = null;
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      this.addNode(item.title, item.content);
    }
  }
}

// ====== Notes List and Trash List Instances ======
const notesList = new LinkedList();
const trashList = new LinkedList();

// Make lists trigger UI updates if desired
notesList.onChange = () => { if (currentView === "Notes") notesList.renderNotes(); };
trashList.onChange = () => { if (currentView === "Trash") trashList.renderTrash(); };

// ====== Undo / Redo Stacks (edit-only) ======
const undoStack = []; // elements: { nodeRef, prevContent }
const redoStack = []; // elements: { nodeRef, prevContent }

// Undo: revert last edit
function undo() {
  if (undoStack.length === 0) {
    alert("Nothing to undo.");
    return;
  }
  const entry = undoStack.pop();
  const { nodeRef, prevContent } = entry;
  // push current state onto redo stack
  redoStack.push({ nodeRef, prevContent: nodeRef.content });
  // restore previous content
  nodeRef.content = prevContent;
  notesList.onChange?.();
  trashList.onChange?.();
}

// Redo: re-apply undone edit
function redo() {
  if (redoStack.length === 0) {
    alert("Nothing to redo.");
    return;
  }
  const entry = redoStack.pop();
  const { nodeRef, prevContent } = entry;
  // push current state onto undo stack
  undoStack.push({ nodeRef, prevContent: nodeRef.content });
  // set content to prevContent (redo)
  nodeRef.content = prevContent;
  notesList.onChange?.();
  trashList.onChange?.();
}

// Keyboard shortcuts for undo/redo
document.addEventListener("keydown", (e) => {
  // Ctrl+Z = undo, Ctrl+Y = redo
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    undo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key === "y")) {
    e.preventDefault();
    redo();
  }
});

// ====== Rendering functions ======
LinkedList.prototype.renderNotes = function() {
  // Not used directly for both lists; using named functions below for clarity
};

notesList.renderNotes = function() {
  notesContainer.innerHTML = "";
  let cur = this.head;
  while (cur) {
    const nodeRef = cur; // capture for closures
    const noteEl = document.createElement("div");
    noteEl.classList.add("note-card");
    noteEl.innerHTML = `
      <h3>${escapeHtml(nodeRef.title)}</h3>
      <p>${escapeHtml(nodeRef.content || "")}</p>
      <div class="note-actions">
        <button class="edit-btn">✏️ Edit</button>
        <button class="delete-btn">🗑️ Delete</button>
      </div>
    `;

    // Edit button
    noteEl.querySelector(".edit-btn").addEventListener("click", () => {
      openModal(nodeRef);
    });

    // Delete -> move to trash
    noteEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Move this note to Trash?")) {
        // add to trash (new node in trash list)
        trashList.addNode(nodeRef.title, nodeRef.content);
        // remove from notes
        notesList.removeNode(nodeRef);
        // clear redo stack (edit history becomes stale for moved nodes)
        // but keep undo stack entries that refer to other nodes
        clearStacksReferencing(nodeRef);
        if (currentView === "Notes") notesList.renderNotes();
        if (currentView === "Trash") trashList.renderTrash();
      }
    });

    notesContainer.appendChild(noteEl);
    cur = cur.next;
  }
};

trashList.renderTrash = function() {
  notesContainer.innerHTML = "";
  let cur = this.head;
  while (cur) {
    const nodeRef = cur;
    const noteEl = document.createElement("div");
    noteEl.classList.add("note-card");
    noteEl.innerHTML = `
      <h3>${escapeHtml(nodeRef.title)}</h3>
      <p>${escapeHtml(nodeRef.content || "")}</p>
      <div class="note-actions">
        <button class="restore-btn">♻️ Restore</button>
        <button class="delete-btn">❌ Delete Permanently</button>
      </div>
    `;

    // Restore (back to notes)
    noteEl.querySelector(".restore-btn").addEventListener("click", () => {
      notesList.addNode(nodeRef.title, nodeRef.content);
      trashList.removeNode(nodeRef);
      clearStacksReferencing(nodeRef);
      if (currentView === "Trash") trashList.renderTrash();
      if (currentView === "Notes") notesList.renderNotes();
    });

    // Permanent delete from trash
    noteEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Permanently delete this note?")) {
        trashList.removeNode(nodeRef);
        clearStacksReferencing(nodeRef);
        if (currentView === "Trash") trashList.renderTrash();
      }
    });

    notesContainer.appendChild(noteEl);
    cur = cur.next;
  }
};

// Utility: remove undo/redo stack entries that reference a node that's been deleted/moved
function clearStacksReferencing(targetNode) {
  for (let i = undoStack.length - 1; i >= 0; i--) {
    if (undoStack[i].nodeRef === targetNode) undoStack.splice(i, 1);
  }
  for (let i = redoStack.length - 1; i >= 0; i--) {
    if (redoStack[i].nodeRef === targetNode) redoStack.splice(i, 1);
  }
}

// ====== Save Note (new or edited) ======
saveBtn.addEventListener("click", () => {
  const title = noteTitleInput.value.trim();
  const content = noteTextInput.value.trim();

  if (!title && !content) {
    alert("Please enter a title or some content.");
    return;
  }

  if (editingNode) {
    // push previous content to undo stack
    undoStack.push({ nodeRef: editingNode, prevContent: editingNode.content });
    // clear redo because new action invalidates redo history
    redoStack.length = 0;

    editingNode.content = content;
    // re-render notes/trash as appropriate
    notesList.onChange?.();
    trashList.onChange?.();
  } else {
    // Add new node to notes
    notesList.addNode(title || "Untitled", content);
  }

  editingNode = null;
  closeModal();
  saveToLocalStorageDebounced();
});

// ====== Search ======
function doesNodeMatchSearch(node, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (node.title && node.title.toLowerCase().includes(lower)) ||
         (node.content && node.content.toLowerCase().includes(lower));
}

searchBar.addEventListener("input", (e) => {
  const q = e.target.value.trim();
  if (currentView === "Notes") {
    // render only notes matching query
    notesContainer.innerHTML = "";
    let cur = notesList.head;
    while (cur) {
      if (doesNodeMatchSearch(cur, q)) {
        const nodeRef = cur;
        const noteEl = document.createElement("div");
        noteEl.classList.add("note-card");
        noteEl.innerHTML = `
          <h3>${escapeHtml(nodeRef.title)}</h3>
          <p>${escapeHtml(nodeRef.content || "")}</p>
          <div class="note-actions">
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">🗑️ Delete</button>
          </div>
        `;
        noteEl.querySelector(".edit-btn").addEventListener("click", () => openModal(nodeRef));
        noteEl.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("Move this note to Trash?")) {
            trashList.addNode(nodeRef.title, nodeRef.content);
            notesList.removeNode(nodeRef);
            clearStacksReferencing(nodeRef);
            if (currentView === "Notes") notesList.renderNotes();
            if (currentView === "Trash") trashList.renderTrash();
          }
        });
        notesContainer.appendChild(noteEl);
      }
      cur = cur.next;
    }
  } else if (currentView === "Trash") {
    notesContainer.innerHTML = "";
    let cur = trashList.head;
    while (cur) {
      if (doesNodeMatchSearch(cur, q)) {
        const nodeRef = cur;
        const noteEl = document.createElement("div");
        noteEl.classList.add("note-card");
        noteEl.innerHTML = `
          <h3>${escapeHtml(nodeRef.title)}</h3>
          <p>${escapeHtml(nodeRef.content || "")}</p>
          <div class="note-actions">
            <button class="restore-btn">♻️ Restore</button>
            <button class="delete-btn">❌ Delete Permanently</button>
          </div>
        `;
        noteEl.querySelector(".restore-btn").addEventListener("click", () => {
          notesList.addNode(nodeRef.title, nodeRef.content);
          trashList.removeNode(nodeRef);
          clearStacksReferencing(nodeRef);
          if (currentView === "Trash") trashList.renderTrash();
          if (currentView === "Notes") notesList.renderNotes();
        });
        noteEl.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("Permanently delete this note?")) {
            trashList.removeNode(nodeRef);
            clearStacksReferencing(nodeRef);
            if (currentView === "Trash") trashList.renderTrash();
          }
        });
        notesContainer.appendChild(noteEl);
      }
      cur = cur.next;
    }
  }
});

// ====== Sync (localStorage save/load) ======
function saveToLocalStorage() {
  try {
    const data = {
      notes: notesList.toArray(),
      trash: trashList.toArray()
    };
    localStorage.setItem("notiva:data", JSON.stringify(data));
    // small feedback: flash or alert could be added
    console.log("Saved to localStorage.");
  } catch (err) {
    console.error("Failed to save:", err);
  }
}

// small debounce to avoid saving too often
let saveDebounceTimer = null;
function saveToLocalStorageDebounced() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(saveToLocalStorage, 300);
}

syncBtn.addEventListener("click", () => {
  saveToLocalStorage();
  alert("Synced (saved to localStorage).");
});

// On startup: load from localStorage if exists
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem("notiva:data");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.notes && Array.isArray(parsed.notes)) {
      notesList.head = null; // clear
      for (const item of parsed.notes) {
        notesList.addNode(item.title, item.content);
      }
    }
    if (parsed.trash && Array.isArray(parsed.trash)) {
      trashList.head = null;
      for (const item of parsed.trash) {
        trashList.addNode(item.title, item.content);
      }
    }
  } catch (err) {
    console.error("Failed to load saved data:", err);
  }
}

// ====== Small utilities ======
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ====== Initialization ======
(function init() {
  // Load saved data
  loadFromLocalStorage();

  // Initial render (default to Notes)
  notesList.renderNotes();

  // If Trash was requested as current view, show that instead
  if (currentView === "Trash") trashList.renderTrash();
})();

