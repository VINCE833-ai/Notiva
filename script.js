const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("expanded")) {
    sidebar.classList.remove("expanded");
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
    sidebar.classList.add("expanded");
  }
});
