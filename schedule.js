/**
 * PlayDelay — ESPN college-football schedules (client-side, no API key).
 * Times shown in America/Phoenix for Brad.
 */
(() => {
  "use strict";

  const SEASON = 2026;
  const TZ = "America/Phoenix";
  const TZ_LABEL = "PT";

  const TEAM_META = {
    byu: {
      id: "byu",
      espnId: "252",
      label: "BYU",
      scheduleUrl:
        "https://www.espn.com/college-football/team/schedule/_/id/252",
    },
    utah: {
      id: "utah",
      espnId: "254",
      label: "Utah",
      scheduleUrl:
        "https://www.espn.com/college-football/team/schedule/_/id/254",
    },
    asu: {
      id: "asu",
      espnId: "9",
      label: "ASU",
      scheduleUrl:
        "https://www.espn.com/college-football/team/schedule/_/id/9",
    },
    usc: {
      id: "usc",
      espnId: "30",
      label: "USC",
      scheduleUrl:
        "https://www.espn.com/college-football/team/schedule/_/id/30",
    },
  };

  function scheduleApiUrl(espnId) {
    return (
      "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/" +
      espnId +
      "/schedule?season=" +
      SEASON
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
      timeZone: TZ,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
    if (timeValid === false) {
      return { dateLine, timeLine: "Time TBD" };
    }
    const timeLine =
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hour: "numeric",
        minute: "2-digit",
      }).format(d) +
      " " +
      TZ_LABEL;
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

  function renderList(host, games, emptyMsg) {
    if (!games.length) {
      host.innerHTML =
        '<p class="sched-empty">' + escapeHtml(emptyMsg) + "</p>";
      return;
    }
    host.innerHTML =
      '<ul class="sched-list" role="list">' +
      games.map(gameRowHtml).join("") +
      "</ul>";
  }

  function setStatus(el, kind, text) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "sched-status" + (kind ? " sched-status-" + kind : "");
  }

  async function fetchSchedule(teamKey) {
    const meta = TEAM_META[teamKey];
    if (!meta) throw new Error("Unknown team");
    const res = await fetch(scheduleApiUrl(meta.espnId), {
      credentials: "omit",
      mode: "cors",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return { meta, ...parseEvents(data, meta.espnId) };
  }

  /**
   * Mount player schedule for one team into a container that expects:
   * #scheduleStatus, #scheduleUpcoming, #scheduleRecent, #scheduleAttr
   */
  async function mountPlayer(teamKey, root) {
    const host = root || document.getElementById("schedulePanel");
    if (!host) return;
    const statusEl = host.querySelector("#scheduleStatus") || host.querySelector(".sched-status");
    const upEl = host.querySelector("#scheduleUpcoming");
    const recentEl = host.querySelector("#scheduleRecent");
    const attrEl = host.querySelector("#scheduleAttr");
    const titleEl = host.querySelector("#scheduleTitle");

    const meta = TEAM_META[teamKey] || TEAM_META.byu;
    if (titleEl) titleEl.textContent = meta.label + " schedule";
    if (attrEl) {
      attrEl.innerHTML =
        'Schedule via <a href="' +
        meta.scheduleUrl +
        '" target="_blank" rel="noopener noreferrer">ESPN</a>';
    }

    setStatus(statusEl, "loading", "Loading schedule…");
    if (upEl) upEl.innerHTML = "";
    if (recentEl) recentEl.innerHTML = "";

    try {
      const { upcoming, recent } = await fetchSchedule(teamKey);
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
   * Compact dual-team schedule on the landing page.
   * Expects #landingSchedByu/Utah/Asu/Usc containers.
   */
  async function mountLanding() {
    const pairs = [
      ["byu", document.getElementById("landingSchedByu")],
      ["utah", document.getElementById("landingSchedUtah")],
      ["asu", document.getElementById("landingSchedAsu")],
      ["usc", document.getElementById("landingSchedUsc")],
    ];
    await Promise.all(
      pairs.map(async ([key, el]) => {
        if (!el) return;
        const meta = TEAM_META[key];
        el.innerHTML =
          '<div class="sched-status sched-status-loading">Loading…</div>';
        try {
          const { upcoming, recent } = await fetchSchedule(key);
          const next = upcoming.slice(0, 3);
          const last = recent.slice(0, 2);
          const rows = [...last.reverse(), ...next];
          el.innerHTML =
            '<div class="landing-sched-head">' +
            "<h3>" +
            escapeHtml(meta.label) +
            "</h3>" +
            '<a class="sched-espn-link" href="' +
            meta.scheduleUrl +
            '" target="_blank" rel="noopener noreferrer">ESPN</a>' +
            "</div>" +
            (rows.length
              ? '<ul class="sched-list sched-list-compact" role="list">' +
                rows.map(gameRowHtml).join("") +
                "</ul>"
              : '<p class="sched-empty">No games listed.</p>');
        } catch (err) {
          console.warn("Landing schedule failed", key, err);
          el.innerHTML =
            '<div class="sched-status sched-status-error">Couldn’t load ESPN schedule</div>' +
            '<a class="sched-espn-link" href="' +
            meta.scheduleUrl +
            '" target="_blank" rel="noopener noreferrer">Schedule via ESPN</a>';
        }
      })
    );
  }

  window.PlayDelaySchedule = {
    TEAM_META,
    mountPlayer,
    mountLanding,
    fetchSchedule,
  };

  // Auto-mount landing if containers exist
  if (document.getElementById("landingSchedByu")) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => mountLanding());
    } else {
      mountLanding();
    }
  }
})();
