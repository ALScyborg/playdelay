/**
 * PlayDelay — ESPN college football & men's basketball schedules (client-side).
 * Times shown in the user's local timezone (browser default).
 * Sport preference: localStorage playdelay.lastSport = "football" | "mbb"
 */
(() => {
  "use strict";

  const SEASON = 2026;
  const SPORT_STORAGE_KEY = "playdelay.lastSport";
  const SPORTS = {
    football: {
      id: "football",
      label: "Football",
      shortLabel: "Football",
      apiPath: "football/college-football",
      espnPath: "college-football",
      seasonLabel: "2026",
    },
    mbb: {
      id: "mbb",
      label: "Basketball",
      shortLabel: "Basketball",
      apiPath: "basketball/mens-college-basketball",
      espnPath: "mens-college-basketball",
      seasonLabel: "2025-26",
    },
  };

  const TEAM_META =
    (window.PlayDelayTeams &&
      typeof window.PlayDelayTeams.teamMetaMap === "function" &&
      window.PlayDelayTeams.teamMetaMap()) ||
    {
      byu: { id: "byu", espnId: "252", label: "BYU", group: "big12" },
      utah: { id: "utah", espnId: "254", label: "Utah", group: "big12" },
      asu: { id: "asu", espnId: "9", label: "ASU", group: "big12" },
      usc: { id: "usc", espnId: "30", label: "USC", group: "other" },
    };

  const TEAM_STORAGE_KEY = "playdelay.lastTeam";

  function readLandingTeam() {
    if (window.PlayDelayTeams && typeof window.PlayDelayTeams.readStoredTeamId === "function") {
      return window.PlayDelayTeams.readStoredTeamId("byu");
    }
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (raw && TEAM_META[raw]) return raw;
    } catch (_) {}
    return "byu";
  }

  function trackScheduleView(teamKey, sport) {
    const u = window.PlayDelayUsage;
    if (!u || typeof u.track !== "function") return;
    const meta = TEAM_META[teamKey];
    if (!meta) return;
    u.track("schedule_view", {
      team_id: meta.id,
      team_label: meta.label,
      sport: sport || readSport(),
    });
  }

  function readSport() {
    try {
      const raw = localStorage.getItem(SPORT_STORAGE_KEY);
      if (raw === "football" || raw === "mbb") return raw;
    } catch (_) {}
    return "football";
  }

  function persistSport(sport) {
    if (sport !== "football" && sport !== "mbb") return;
    try {
      localStorage.setItem(SPORT_STORAGE_KEY, sport);
    } catch (_) {}
  }

  function sportMeta(sport) {
    return SPORTS[sport] || SPORTS.football;
  }

  function scheduleApiUrl(espnId, sport) {
    const s = sportMeta(sport);
    return (
      "https://site.api.espn.com/apis/site/v2/sports/" +
      s.apiPath +
      "/teams/" +
      espnId +
      "/schedule?season=" +
      SEASON
    );
  }

  function schedulePageUrl(espnId, sport) {
    const s = sportMeta(sport);
    return (
      "https://www.espn.com/" + s.espnPath + "/team/schedule/_/id/" + espnId
    );
  }

  function scoreDisplay(comp) {
    if (!comp) return null;
    const s = comp.score;
    if (s == null) return null;
    if (typeof s === "object") return s.displayValue || String(s.value ?? "");
    return String(s);
  }

  function broadcastLabel(competition) {
    const list = competition && competition.broadcasts;
    if (!Array.isArray(list) || !list.length) return "";
    const names = [];
    for (const b of list) {
      const n = (b.media && b.media.shortName) || "";
      if (n && !names.includes(n)) names.push(n);
    }
    return names.join(", ");
  }

  function formatWhen(iso, timeValid) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { dateLine: "Date TBA", timeLine: "" };
    const dateLine = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
    if (timeValid === false) {
      return { dateLine, timeLine: "Time TBD" };
    }
    const timeLine = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(d);
    return { dateLine, timeLine };
  }

  function parseEvents(data, espnId) {
    const events = Array.isArray(data && data.events) ? data.events : [];
    const now = Date.now();
    const parsed = events.map((ev) => {
      const competition = (ev.competitions && ev.competitions[0]) || {};
      const competitors = competition.competitors || [];
      const us =
        competitors.find((c) => String(c.id) === String(espnId)) || null;
      const opp =
        competitors.find((c) => String(c.id) !== String(espnId)) || null;
      const statusType = (competition.status && competition.status.type) || {};
      const state = statusType.state || "pre";
      const completed = !!statusType.completed || state === "post";
      const homeAway = (us && us.homeAway) || "home";
      const haLabel = competition.neutralSite
        ? "Neutral"
        : homeAway === "home"
          ? "Home"
          : "Away";
      const vsPrefix = competition.neutralSite
        ? "vs"
        : homeAway === "home"
          ? "vs"
          : "@";
      const oppName =
        (opp &&
          opp.team &&
          (opp.team.shortDisplayName ||
            opp.team.abbreviation ||
            opp.team.displayName)) ||
        "TBD";
      const when = formatWhen(
        competition.date || ev.date,
        competition.timeValid !== false && ev.timeValid !== false
      );
      let result = "";
      if (completed && us) {
        const usScore = scoreDisplay(us);
        const oppScore = scoreDisplay(opp);
        const wl =
          us.winner === true ? "W" : us.winner === false ? "L" : "—";
        if (usScore != null && oppScore != null) {
          result = wl + " " + usScore + "–" + oppScore;
        } else {
          result = statusType.shortDetail || statusType.description || "Final";
        }
      } else if (state === "in") {
        result = statusType.shortDetail || "Live";
      }

      const ts = new Date(competition.date || ev.date).getTime();
      return {
        id: ev.id,
        ts: Number.isFinite(ts) ? ts : 0,
        completed,
        state,
        oppName,
        vsPrefix,
        haLabel,
        dateLine: when.dateLine,
        timeLine: when.timeLine,
        tv: broadcastLabel(competition),
        result,
        isPast: completed || (Number.isFinite(ts) && ts < now - 3 * 3600 * 1000),
      };
    });

    const upcoming = parsed
      .filter((g) => !g.completed && g.state !== "post")
      .sort((a, b) => a.ts - b.ts);
    const recent = parsed
      .filter((g) => g.completed || g.state === "post")
      .sort((a, b) => b.ts - a.ts);

    return { upcoming, recent };
  }

  function gameRowHtml(g) {
    const tv = g.tv
      ? '<span class="sched-tv">' + escapeHtml(g.tv) + "</span>"
      : "";
    const result = g.result
      ? '<span class="sched-result">' + escapeHtml(g.result) + "</span>"
      : "";
    const time = g.timeLine
      ? '<span class="sched-time">' + escapeHtml(g.timeLine) + "</span>"
      : "";
    return (
      '<li class="sched-row">' +
      '<div class="sched-when">' +
      '<span class="sched-date">' +
      escapeHtml(g.dateLine) +
      "</span>" +
      time +
      "</div>" +
      '<div class="sched-match">' +
      '<span class="sched-ha">' +
      escapeHtml(g.haLabel) +
      "</span>" +
      '<span class="sched-opp">' +
      escapeHtml(g.vsPrefix + " " + g.oppName) +
      "</span>" +
      "</div>" +
      '<div class="sched-meta">' +
      tv +
      result +
      "</div>" +
      "</li>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setStatus(el, kind, text) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "sched-status" + (kind ? " sched-status-" + kind : "");
  }

  function sportToggleButtonsHtml(activeSport) {
    const sport = activeSport === "mbb" ? "mbb" : "football";
    return (
      '<button type="button" class="btn btn-sport' +
      (sport === "football" ? " is-active" : "") +
      '" data-sport="football" aria-pressed="' +
      (sport === "football" ? "true" : "false") +
      '">Football</button>' +
      '<button type="button" class="btn btn-sport' +
      (sport === "mbb" ? " is-active" : "") +
      '" data-sport="mbb" aria-pressed="' +
      (sport === "mbb" ? "true" : "false") +
      '">Basketball</button>'
    );
  }

  function syncSportToggleButtons(root, sport) {
    if (!root) return;
    root.querySelectorAll("[data-sport]").forEach((btn) => {
      const active = btn.getAttribute("data-sport") === sport;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    root.setAttribute("data-active", sport);
  }

  async function fetchSchedule(teamKey, sport) {
    const meta = TEAM_META[teamKey];
    if (!meta) throw new Error("Unknown team");
    const s = sport || readSport();
    const res = await fetch(scheduleApiUrl(meta.espnId, s), {
      credentials: "omit",
      mode: "cors",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return { meta, sport: s, ...parseEvents(data, meta.espnId) };
  }

  function mbbRadioNoteHtml() {
    return (
      '<p class="sched-sport-note" id="scheduleSportNote">' +
      "Basketball radio sync uses this team’s flagship station when games are on " +
      "(same stream as football for now)." +
      "</p>"
    );
  }

  /**
   * Mount player schedule for one team into a container that expects:
   * #scheduleStatus, #scheduleUpcoming, #scheduleRecent, #scheduleAttr
   * Optional #sportToggle host for Football | Basketball.
   */
  async function mountPlayer(teamKey, root) {
    const host = root || document.getElementById("schedulePanel");
    if (!host) return;
    const sport = readSport();
    const sMeta = sportMeta(sport);
    const statusEl =
      host.querySelector("#scheduleStatus") || host.querySelector(".sched-status");
    const upEl = host.querySelector("#scheduleUpcoming");
    const recentEl = host.querySelector("#scheduleRecent");
    const attrEl = host.querySelector("#scheduleAttr");
    const titleEl = host.querySelector("#scheduleTitle");
    const noteHost = host.querySelector("#scheduleSportNoteHost");
    const toggleHost =
      host.querySelector("#sportToggle") ||
      document.getElementById("sportToggle");

    const meta = TEAM_META[teamKey] || TEAM_META.byu;
    const pageUrl = schedulePageUrl(meta.espnId, sport);

    if (toggleHost && !toggleHost.dataset.wired) {
      toggleHost.innerHTML = sportToggleButtonsHtml(sport);
      toggleHost.setAttribute("data-active", sport);
      toggleHost.dataset.wired = "1";
      toggleHost.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-sport]");
        if (!btn) return;
        const next = btn.getAttribute("data-sport");
        if (next !== "football" && next !== "mbb") return;
        if (next === readSport()) return;
        persistSport(next);
        syncSportToggleButtons(toggleHost, next);
        const landingToggle = document.getElementById("landingSportToggle");
        if (landingToggle) syncSportToggleButtons(landingToggle, next);
        const activeTeam =
          (document.body && document.body.dataset.team) ||
          document.documentElement.dataset.team ||
          "byu";
        mountPlayer(TEAM_META[activeTeam] ? activeTeam : "byu", host);
      });
    } else if (toggleHost) {
      syncSportToggleButtons(toggleHost, sport);
    }

    if (titleEl) {
      titleEl.textContent =
        meta.label + " " + (sport === "mbb" ? "basketball" : "football") + " schedule";
    }
    if (attrEl) {
      attrEl.innerHTML =
        'Schedule via <a href="' +
        pageUrl +
        '" target="_blank" rel="noopener noreferrer">ESPN</a>' +
        ' · ' +
        escapeHtml(sMeta.seasonLabel);
    }
    if (noteHost) {
      noteHost.innerHTML = sport === "mbb" ? mbbRadioNoteHtml() : "";
    }

    setStatus(statusEl, "loading", "Loading schedule…");
    if (upEl) upEl.innerHTML = "";
    if (recentEl) recentEl.innerHTML = "";

    try {
      const { upcoming, recent } = await fetchSchedule(teamKey, sport);
      // Ignore stale responses if sport changed mid-fetch
      if (readSport() !== sport) return;
      trackScheduleView(teamKey, sport);
      setStatus(statusEl, "", "");
      if (upEl) {
        const slice = upcoming.slice(0, 6);
        upEl.innerHTML =
          '<h3 class="sched-heading">Upcoming</h3>' +
          (slice.length
            ? '<ul class="sched-list" role="list">' +
              slice.map(gameRowHtml).join("") +
              "</ul>"
            : '<p class="sched-empty">No upcoming games listed.</p>');
      }
      if (recentEl) {
        const slice = recent.slice(0, 4);
        recentEl.innerHTML =
          '<h3 class="sched-heading">Recent</h3>' +
          (slice.length
            ? '<ul class="sched-list" role="list">' +
              slice.map(gameRowHtml).join("") +
              "</ul>"
            : '<p class="sched-empty">No recent results yet.</p>');
      }
    } catch (err) {
      console.warn("ESPN schedule failed", err);
      setStatus(statusEl, "error", "Couldn’t load ESPN schedule");
    }
  }

  /**
   * Landing: sport toggle + team chips, one schedule panel for selected team.
   * Expects #landingTeamChips, #landingSchedPanel, optional #landingSportToggle.
   */
  function buildLandingChips(activeId) {
    const host = document.getElementById("landingTeamChips");
    if (!host) return;
    const registry = window.PlayDelayTeams;
    const big12 = (registry && registry.BIG12_ORDER) || Object.keys(TEAM_META).filter((k) => TEAM_META[k].group !== "other");
    const other = (registry && registry.OTHER_ORDER) || Object.keys(TEAM_META).filter((k) => TEAM_META[k].group === "other");
    const parts = [];
    parts.push('<div class="landing-chip-group">');
    parts.push('<div class="landing-chip-label">Big 12</div>');
    parts.push('<div class="landing-chip-grid">');
    for (const id of big12) {
      const meta = TEAM_META[id];
      if (!meta) continue;
      const active = id === activeId ? " is-active" : "";
      const pressed = id === activeId ? "true" : "false";
      parts.push(
        '<button type="button" class="btn landing-team-chip' +
          active +
          '" data-team-pick="' +
          escapeHtml(id) +
          '" aria-pressed="' +
          pressed +
          '">' +
          escapeHtml(meta.shortLabel || meta.label) +
          "</button>"
      );
    }
    parts.push("</div></div>");
    parts.push('<div class="landing-chip-group">');
    parts.push('<div class="landing-chip-label">Other</div>');
    parts.push('<div class="landing-chip-grid">');
    for (const id of other) {
      const meta = TEAM_META[id];
      if (!meta) continue;
      const active = id === activeId ? " is-active" : "";
      const pressed = id === activeId ? "true" : "false";
      parts.push(
        '<button type="button" class="btn landing-team-chip' +
          active +
          '" data-team-pick="' +
          escapeHtml(id) +
          '" aria-pressed="' +
          pressed +
          '">' +
          escapeHtml(meta.shortLabel || meta.label) +
          "</button>"
      );
    }
    parts.push("</div></div>");
    host.innerHTML = parts.join("");
  }

  function syncLandingChips(activeId) {
    document.querySelectorAll("#landingTeamChips [data-team-pick]").forEach((btn) => {
      const active = btn.getAttribute("data-team-pick") === activeId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  async function renderLandingPanel(teamKey, sport) {
    const el = document.getElementById("landingSchedPanel");
    if (!el) return;
    const meta = TEAM_META[teamKey] || TEAM_META.byu;
    const pageUrl = schedulePageUrl(meta.espnId, sport);
    el.dataset.team = meta.id;
    el.setAttribute("aria-label", meta.label + " schedule");
    el.innerHTML =
      '<div class="landing-sched-toolbar">' +
      '<div class="landing-sched-head is-active" aria-hidden="true">' +
      '<span class="landing-sched-team-label">' +
      escapeHtml(meta.label) +
      "</span>" +
      '<span class="landing-sched-pick-hint">' +
      (meta.hasStream ? "Radio live" : "Schedule · radio soon") +
      "</span>" +
      "</div>" +
      '<a class="sched-espn-link" href="' +
      pageUrl +
      '" target="_blank" rel="noopener noreferrer">ESPN</a>' +
      "</div>" +
      '<div class="sched-status sched-status-loading">Loading…</div>';
    try {
      const { upcoming, recent } = await fetchSchedule(meta.id, sport);
      if (readSport() !== sport) return;
      if (readLandingTeam() !== meta.id && document.body.dataset.team !== meta.id) {
        // Selected team may have changed mid-fetch
        const current = readLandingTeam();
        if (current !== meta.id) return;
      }
      trackScheduleView(meta.id, sport);
      const next = upcoming.slice(0, 6);
      const last = recent.slice(0, 3);
      const rows = [...last.reverse(), ...next];
      el.innerHTML =
        '<div class="landing-sched-toolbar">' +
        '<div class="landing-sched-head is-active" aria-hidden="true">' +
        '<span class="landing-sched-team-label">' +
        escapeHtml(meta.label) +
        "</span>" +
        '<span class="landing-sched-pick-hint">' +
        (meta.hasStream ? "Radio live" : "Schedule · radio soon") +
        "</span>" +
        "</div>" +
        '<a class="sched-espn-link" href="' +
        pageUrl +
        '" target="_blank" rel="noopener noreferrer">ESPN</a>' +
        "</div>" +
        (rows.length
          ? '<ul class="sched-list sched-list-compact" role="list">' +
            rows.map(gameRowHtml).join("") +
            "</ul>"
          : '<p class="sched-empty">No games listed.</p>');
    } catch (err) {
      console.warn("Landing schedule failed", meta.id, err);
      el.innerHTML =
        '<div class="landing-sched-toolbar">' +
        '<div class="landing-sched-head is-active" aria-hidden="true">' +
        '<span class="landing-sched-team-label">' +
        escapeHtml(meta.label) +
        "</span>" +
        '<span class="landing-sched-pick-hint">Tap a team above</span>' +
        "</div>" +
        '<a class="sched-espn-link" href="' +
        pageUrl +
        '" target="_blank" rel="noopener noreferrer">ESPN</a>' +
        "</div>" +
        '<div class="sched-status sched-status-error">Couldn’t load ESPN schedule</div>';
    }
  }

  async function mountLanding() {
    const sport = readSport();
    const toggleHost = document.getElementById("landingSportToggle");
    const sectionTitle = document.getElementById("sched-section-title");
    const sectionNote = document.querySelector(".landing-sched-note");
    const chipsHost = document.getElementById("landingTeamChips");
    const panel = document.getElementById("landingSchedPanel");

    if (!chipsHost && !panel && !document.getElementById("landingSchedByu")) {
      return;
    }

    if (toggleHost && !toggleHost.dataset.wired) {
      toggleHost.innerHTML = sportToggleButtonsHtml(sport);
      toggleHost.setAttribute("data-active", sport);
      toggleHost.dataset.wired = "1";
      toggleHost.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-sport]");
        if (!btn) return;
        const next = btn.getAttribute("data-sport");
        if (next !== "football" && next !== "mbb") return;
        if (next === readSport()) return;
        persistSport(next);
        syncSportToggleButtons(toggleHost, next);
        const playerToggle = document.getElementById("sportToggle");
        if (playerToggle) syncSportToggleButtons(playerToggle, next);
        mountLanding();
      });
    } else if (toggleHost) {
      syncSportToggleButtons(toggleHost, sport);
    }

    if (sectionTitle) {
      sectionTitle.textContent =
        sport === "mbb" ? "Men’s basketball schedule" : "Football schedule";
    }
    if (sectionNote) {
      sectionNote.textContent =
        sport === "mbb"
          ? "2025-26 men’s basketball via ESPN. Pick a team for colors + schedule. Radio sync uses each team’s flagship station when available."
          : "2026 football via ESPN. Pick a Big 12 / Miami / USC team for colors + schedule (saved for next visit).";
    }

    const active = readLandingTeam();
    if (chipsHost) {
      if (!chipsHost.dataset.wired) {
        buildLandingChips(active);
        chipsHost.dataset.wired = "1";
      } else {
        syncLandingChips(active);
      }
    }

    // Apply theme for selected team
    const theme = window.PlayDelayLandingTheme;
    if (theme && typeof theme.applyTeam === "function") {
      theme.applyTeam(active);
    } else if (window.PlayDelayTeams) {
      document.documentElement.dataset.team = active;
      if (document.body) document.body.dataset.team = active;
      const t = window.PlayDelayTeams.get(active);
      if (t) window.PlayDelayTeams.applyThemeVars(t);
    }

    if (panel) {
      await renderLandingPanel(active, sport);
    }
  }

  function setSport(sport) {
    if (sport !== "football" && sport !== "mbb") return;
    persistSport(sport);
    if (
      document.getElementById("landingSchedPanel") ||
      document.getElementById("landingTeamChips") ||
      document.getElementById("landingSchedByu")
    ) {
      mountLanding();
    }
    const panel = document.getElementById("schedulePanel");
    if (panel) {
      const team =
        (document.documentElement.dataset.team ||
          document.body.dataset.team ||
          "byu");
      mountPlayer(TEAM_META[team] ? team : "byu", panel);
    }
  }

  window.PlayDelaySchedule = {
    TEAM_META,
    SPORTS,
    readSport,
    setSport,
    mountPlayer,
    mountLanding,
    fetchSchedule,
  };

  // Auto-mount landing if containers exist
  if (
    document.getElementById("landingSchedPanel") ||
    document.getElementById("landingTeamChips") ||
    document.getElementById("landingSchedByu")
  ) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => mountLanding());
    } else {
      mountLanding();
    }
  }
})();
