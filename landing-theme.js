/**
 * PlayDelay landing — team color theme with localStorage persistence.
 * Shares playdelay.lastTeam with the player (app.js / teams.js).
 */
(() => {
  "use strict";

  const TEAM_STORAGE_KEY = "playdelay.lastTeam";
  const registry = window.PlayDelayTeams;

  function isValid(id) {
    if (registry && typeof registry.isValid === "function") {
      return registry.isValid(id);
    }
    return !!(registry && registry.TEAMS && registry.TEAMS[id]);
  }

  function readTeam() {
    if (registry && typeof registry.readStoredTeamId === "function") {
      return registry.readStoredTeamId("byu");
    }
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (raw && isValid(raw)) return raw;
    } catch (_) {}
    return "byu";
  }

  function persistTeam(id) {
    if (registry && typeof registry.persistTeam === "function") {
      registry.persistTeam(id);
      return;
    }
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
    document.querySelectorAll("#landingTeamChips [data-team-pick]").forEach((btn) => {
      const active = btn.getAttribute("data-team-pick") === id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyTeam(id) {
    if (!isValid(id)) id = "byu";
    document.documentElement.dataset.team = id;
    if (document.body) document.body.dataset.team = id;
    const team = registry && registry.get ? registry.get(id) : null;
    if (registry && typeof registry.applyThemeVars === "function" && team) {
      registry.applyThemeVars(team);
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const color =
        (team && team.theme && team.theme.themeColor) || "#0a1628";
      themeMeta.setAttribute("content", color);
    }
    syncSelectedCards(id);
  }

  function setTeam(id) {
    if (!isValid(id)) return;
    persistTeam(id);
    applyTeam(id);
    const u = window.PlayDelayUsage;
    if (u && typeof u.track === "function") {
      const team = registry && registry.get ? registry.get(id) : null;
      u.track("select", {
        team_id: id,
        team_label: (team && team.label) || id,
      });
    }
    const sched = window.PlayDelaySchedule;
    if (sched && typeof sched.mountLanding === "function") {
      sched.mountLanding();
    }
  }

  applyTeam(readTeam());

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-team-pick]");
    if (!pick) return;
    if (e.target.closest("a")) return;
    const id = pick.getAttribute("data-team-pick");
    if (!isValid(id)) return;
    e.preventDefault();
    setTeam(id);
  });

  document.addEventListener("keydown", (e) => {
    const pick = e.target.closest("[data-team-pick]");
    if (!pick) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const id = pick.getAttribute("data-team-pick");
    if (!isValid(id)) return;
    e.preventDefault();
    setTeam(id);
  });

  const chips = document.getElementById("landingTeamChips");
  const grid = document.querySelector(".landing-sched-grid");
  const observeTarget = chips || grid;
  if (observeTarget) {
    const mo = new MutationObserver(() => syncSelectedCards(readTeam()));
    mo.observe(observeTarget, { childList: true, subtree: true });
  }

  window.PlayDelayLandingTheme = { applyTeam, setTeam, readTeam };
})();
