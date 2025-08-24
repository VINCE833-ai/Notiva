const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// Sidebar toggle
menuBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("expanded")) {
    sidebar.classList.remove("expanded");
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
    sidebar.classList.add("expanded");
  }
});

// Highlight active menu icon
const menuItems = document.querySelectorAll(".menu-item");
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// Modal elements
const newNoteBtn = document.getElementById("newNoteBtn");
const noteModal = document.getElementById("noteModal");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const saveBtn = document.querySelector(".save-btn");
const noteTitleInput = document.querySelector(".note-title");
const noteTextInput = document.querySelector(".note-text");

// Open/close modal helpers
function openModal() {
  noteModal.classList.remove("hidden");
  // Optional: focus title after animation tick
  setTimeout(() => noteTitleInput.focus(), 0);
}
function closeModal() {
  noteModal.classList.add("hidden");
}

// Open modal
newNoteBtn.addEventListener("click", openModal);

// Close modal (X and Cancel)
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// Close when clicking backdrop
noteModal.addEventListener("click", (e) => {
  if (e.target === noteModal) closeModal();
});

// --- Linked List Implementation ---
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
    if (this.head === null) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) current = current.next;
      current.next = newNode;
    }
    console.log("✅ Note added:", { title, content });
    this.printList();
  }

  printList() {
    let current = this.head;
    const notes = [];
    while (current !== null) {
      notes.push({ title: current.title, content: current.content });
      current = current.next;
    }
    console.log("📒 All Notes (Linked List):", notes);
  }
}

const notesList = new LinkedList();

// Save note -> add node to Linked List
saveBtn.addEventListener("click", () => {
  const title = noteTitleInput.value.trim();
  const content = noteTextInput.value.trim();

  if (!title && !content) {
    alert("Please enter a title or some content.");
    return;
  }

  notesList.addNode(title || "Untitled", content);

  // Clear fields and close
  noteTitleInput.value = "";
  noteTextInput.value = "";
  closeModal();
});
