/**
 * PlayDelay landing — team color theme with localStorage persistence.
 * Shares playdelay.lastTeam with the player (app.js).
 */
(() => {
  "use strict";

  const TEAM_STORAGE_KEY = "playdelay.lastTeam";
  const VALID = new Set(["byu", "utah", "asu", "usc"]);
  const THEME_COLORS = {
    byu: "#0a1628",
    utah: "#1a0508",
    asu: "#1a0a12",
    usc: "#1a0c0c",
  };

  function readTeam() {
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (raw && VALID.has(raw)) return raw;
    } catch (_) {}
    return "byu";
  }

  function persistTeam(id) {
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, id);
    } catch (_) {}
  }

  function syncSelectedCards(id) {
    document.querySelectorAll(".landing-sched-card[data-team]").forEach((card) => {
      const active = card.dataset.team === id;
      card.classList.toggle("is-selected", active);
      const btn = card.querySelector("[data-team-pick]");
      if (btn) {
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.classList.toggle("is-active", active);
      }
    });
  }

  function applyTeam(id) {
    if (!VALID.has(id)) id = "byu";
    document.documentElement.dataset.team = id;
    if (document.body) document.body.dataset.team = id;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[id] || THEME_COLORS.byu);
    }
    syncSelectedCards(id);
  }

  function setTeam(id) {
    if (!VALID.has(id)) return;
    persistTeam(id);
    applyTeam(id);
  }

  applyTeam(readTeam());

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-team-pick]");
    if (!pick) return;
    if (e.target.closest("a")) return;
    const id = pick.getAttribute("data-team-pick");
    if (!VALID.has(id)) return;
    e.preventDefault();
    setTeam(id);
  });

  document.addEventListener("keydown", (e) => {
    const pick = e.target.closest("[data-team-pick]");
    if (!pick) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const id = pick.getAttribute("data-team-pick");
    if (!VALID.has(id)) return;
    e.preventDefault();
    setTeam(id);
  });

  // Re-sync selected state after schedule.js fills cards
  const grid = document.querySelector(".landing-sched-grid");
  if (grid) {
    const mo = new MutationObserver(() => syncSelectedCards(readTeam()));
    mo.observe(grid, { childList: true, subtree: true });
  }

  window.PlayDelayLandingTheme = { applyTeam, setTeam, readTeam };
})();
