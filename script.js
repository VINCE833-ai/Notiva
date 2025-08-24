const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// Sidebar toggle
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
  sidebar.classList.toggle("collapsed");
});

// Highlight active menu item
const menuItems = document.querySelectorAll(".menu-item");
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
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

let editingNode = null; // Track if we're editing an existing note

function openModal(editNode = null) {
  noteModal.classList.remove("hidden");

  if (editNode) {
    editingNode = editNode;
    noteTitleInput.value = editNode.title;
    noteTextInput.value = editNode.content;
  } else {
    editingNode = null;
    noteTitleInput.value = "";
    noteTextInput.value = "";
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

// Linked List for notes
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
    this.renderNotes();
  }

  deleteNode(target) {
    if (!this.head) return;

    if (this.head === target) {
      this.head = this.head.next;
      this.renderNotes();
      return;
    }

    let cur = this.head;
    while (cur.next && cur.next !== target) {
      cur = cur.next;
    }

    if (cur.next === target) {
      cur.next = target.next;
    }
    this.renderNotes();
  }

  renderNotes() {
    notesContainer.innerHTML = "";
    let cur = this.head;

    while (cur) {
      const noteEl = document.createElement("div");
      noteEl.classList.add("note-card");

      noteEl.innerHTML = `
        <h3>${cur.title}</h3>
        <p>${cur.content || ""}</p>
        <button class="edit-btn">✏️ Edit</button>
        <button class="delete-btn">🗑️ Delete</button>
      `;

      // Edit button handler
      noteEl.querySelector(".edit-btn").addEventListener("click", () => {
        openModal(cur);
      });

      // Delete button handler
      noteEl.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this note?")) {
          this.deleteNode(cur);
        }
      });

      notesContainer.appendChild(noteEl);
      cur = cur.next;
    }
  }
}
const notesList = new LinkedList();

// Save note (new or edited)
saveBtn.addEventListener("click", () => {
  const title = noteTitleInput.value.trim();
  const content = noteTextInput.value.trim();

  if (!title && !content) {
    alert("Please enter a title or some content.");
    return;
  }

  if (editingNode) {
    // Update existing note
    editingNode.title = title || "Untitled";
    editingNode.content = content;
    notesList.renderNotes();
  } else {
    // Create new note
    notesList.addNode(title || "Untitled", content);
  }

  editingNode = null;
  closeModal();
});
