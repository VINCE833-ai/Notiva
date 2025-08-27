const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// Sidebar toggle
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
  sidebar.classList.toggle("collapsed");
});

// Highlight active menu item + view switching
const menuItems = document.querySelectorAll(".menu-item");
let currentView = "Notes"; // "Notes" | "Trash"
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const label = item.querySelector(".menu-title")?.textContent.trim();
    if (label === "Notes List") { currentView = "Notes"; notesList.renderNotes(); }
    if (label === "Trash")      { currentView = "Trash"; trashList.renderTrash(); }
    // "Archive" and others can be wired later if needed
  });
});

// Modal logic
const newNoteBtn = document.getElementById("newNoteBtn");
const noteModal = document.getElementById("noteModal");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const saveBtn = document.querySelector(".save-btn");
const noteTitleInput = document.querySelector(".note-title");
const noteTextInput = document.querySelector(".note-text");
const notesContainer = document.getElementById("notesContainer");

let editingNode = null;

function openModal(editNode = null) {
  noteModal.classList.remove("hidden");
  if (editNode) {
    editingNode = editNode;
    noteTitleInput.value = editNode.title;
    noteTextInput.value = editNode.content;
    noteTitleInput.disabled = true; // title cannot be changed
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
}

newNoteBtn.addEventListener("click", () => openModal());
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
noteModal.addEventListener("click", (e) => {
  if (e.target === noteModal) closeModal();
});

// Linked List node
class Node {
  constructor(title, content) {
    this.title = title;
    this.content = content;
    this.next = null;
  }
}

// Notes List
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
    this.renderNotes();
  }

  removeNode(target) {
    if (!this.head) return;
    if (this.head === target) {
      this.head = this.head.next;
      return;
    }
    let cur = this.head;
    while (cur.next && cur.next !== target) cur = cur.next;
    if (cur.next === target) cur.next = target.next;
  }

  renderNotes() {
    notesContainer.innerHTML = "";
    let cur = this.head;
    while (cur) {
      const nodeRef = cur; // IMPORTANT: capture this iteration's node
      const noteEl = document.createElement("div");
      noteEl.classList.add("note-card");
      noteEl.innerHTML = `
        <h3>${nodeRef.title}</h3>
        <p>${nodeRef.content || ""}</p>
        <button class="edit-btn">✏️ Edit</button>
        <button class="delete-btn">🗑️ Delete</button>
      `;

      // Edit
      noteEl.querySelector(".edit-btn").addEventListener("click", () => {
        openModal(nodeRef);
      });

      // Delete -> move to Trash first, then remove from Notes
      noteEl.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Move this note to Trash?")) {
          trashList.addNode(nodeRef.title, nodeRef.content);
          this.removeNode(nodeRef);
          this.renderNotes();
          if (currentView === "Trash") trashList.renderTrash();
        }
      });

      notesContainer.appendChild(noteEl);
      cur = cur.next;
    }
  }
}

// Trash List
class TrashList {
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
  }

  deleteNodePermanently(target) {
    if (!this.head) return;
    if (this.head === target) {
      this.head = this.head.next;
      return;
    }
    let cur = this.head;
    while (cur.next && cur.next !== target) cur = cur.next;
    if (cur.next === target) cur.next = target.next;
  }

  renderTrash() {
    notesContainer.innerHTML = "";
    let cur = this.head;
    while (cur) {
      const nodeRef = cur; // IMPORTANT: capture per-iteration node
      const noteEl = document.createElement("div");
      noteEl.classList.add("note-card");
      noteEl.innerHTML = `
        <h3>${nodeRef.title}</h3>
        <p>${nodeRef.content || ""}</p>
        <button class="restore-btn">♻️ Restore</button>
        <button class="delete-btn">❌ Delete Permanently</button>
      `;

      // Restore
      noteEl.querySelector(".restore-btn").addEventListener("click", () => {
        notesList.addNode(nodeRef.title, nodeRef.content);
        this.deleteNodePermanently(nodeRef);
        this.renderTrash();
        if (currentView === "Notes") notesList.renderNotes();
      });

      // Permanent delete
      noteEl.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Permanently delete this note?")) {
          this.deleteNodePermanently(nodeRef);
          this.renderTrash();
        }
      });

      notesContainer.appendChild(noteEl);
      cur = cur.next;
    }
  }
}

const notesList = new LinkedList();
const trashList = new TrashList();

// Save note (new or edited)
saveBtn.addEventListener("click", () => {
  const title = noteTitleInput.value.trim();
  const content = noteTextInput.value.trim();

  if (!title && !content) {
    alert("Please enter a title or some content.");
    return;
  }

  if (editingNode) {
    // Only content can change
    editingNode.content = content;
    notesList.renderNotes();
  } else {
    notesList.addNode(title || "Untitled", content);
  }

  editingNode = null;
  closeModal();
});
