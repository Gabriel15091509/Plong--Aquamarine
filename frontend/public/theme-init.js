// Runs before rendering so the saved theme does not flash in light mode.
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (!theme) {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (error) { /* Storage may be unavailable in private browsing. */ }
})();
