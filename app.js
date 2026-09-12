/**
 * PlayDelay — multi-team radio with AudioWorklet delay.
 * Sound-first: never leave a captured <audio> silent after a failed graph.
 */
(() => {
  "use strict";

  const registry = window.PlayDelayTeams;
  if (!registry) {
    console.error("PlayDelayTeams missing — load teams.js first");
  }
  const TEAMS = (registry && registry.TEAMS) || {};
  const LIVE_LABELS =
    (registry && registry.LIVE_STREAM_LABELS) || [];

  const TEAM_STORAGE_KEY = "playdelay.lastTeam";
  const WORKLET_URL = "./worklets/delay-processor.js";
  const MAX_DELAY = 120;

  const playBtn = document.getElementById("playBtn");
  const muteBtn = document.getElementById("muteBtn");
  const volumeEl = document.getElementById("volume");
  const delayValueEl = document.getElementById("delayValue");
  const statusChip = document.getElementById("statusChip");
  const bannerEl = document.getElementById("banner");
  const toastEl = document.getElementById("toast");
  const brandMarkEl = document.getElementById("brandMark");
  const stationTitleEl = document.getElementById("stationTitle");
  const teamToggle = document.getElementById("teamToggle");
  let teamButtons = [];
  const presetButtons = Array.from(document.querySelectorAll("[data-delay]"));
  const stepButtons = Array.from(document.querySelectorAll("[data-delta]"));
  const audioHost = document.getElementById("audio");

  /** @type {HTMLAudioElement} */
  let audio = audioHost;

  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AudioWorkletNode | null} */
  let delayNode = null;
  /** @type {MediaElementAudioSourceNode | null} */
  let sourceNode = null;
  /** @type {GainNode | null} */
  let gainNode = null;
  /** @type {AnalyserNode | null} */
  let analyser = null;

  let targetDelay = 0;
  let displayDelay = 0;
  let usingWorklet = false;
  let workletFailed = false;
  let workletFailReason = "";
  let isPlaying = false;
  let toastTimer = 0;
  let silenceWatch = 0;
  let workletModuleLoaded = false;
  let switchingTeam = false;
  let reconnecting = false;
  let livePlaybackStarted = false;
  let stallTimer = 0;
  let lastMediaTime = NaN;
  /** @type {number[]} */
  let reconnectAttemptAt = [];
  const STALL_RECONNECT_MS = 1000;
  const RECONNECT_MAX = 5;
  const RECONNECT_WINDOW_MS = 60000;

  function readStoredTeamId() {
    if (registry && typeof registry.readStoredTeamId === "function") {
      return registry.readStoredTeamId("byu");
    }
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (raw && TEAMS[raw]) return raw;
    } catch (_) {}
    return "byu";
  }

  /** @type {typeof TEAMS[keyof typeof TEAMS]} */
  let currentTeam = TEAMS[readStoredTeamId()] || TEAMS.byu;

  function streamUrl() {
    return currentTeam.streamUrl || "";
  }

  function hasStream() {
    return !!(currentTeam && currentTeam.streamUrl);
  }

  function refreshSchedule() {
    const sched = window.PlayDelaySchedule;
    if (sched && typeof sched.mountPlayer === "function") {
      sched.mountPlayer(currentTeam.id);
    }
  }

  function updateStreamAvailability() {
    const ok = hasStream();
    playBtn.disabled = !ok;
    playBtn.setAttribute("aria-disabled", ok ? "false" : "true");
    if (!ok) {
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Play";
      setStatus("idle", "Soon");
      showBanner(
        currentTeam.label +
          " radio stream coming soon. Schedule is below — pick " +
          LIVE_LABELS.join(", ") +
          " to listen now.",
        false
      );
    } else {
      // Clear coming-soon banner when switching back to a live team (unless playing error)
      if (
        bannerEl &&
        !bannerEl.hidden &&
        /coming soon/i.test(bannerEl.textContent || "")
      ) {
        showBanner("", false);
      }
      if (!isPlaying) {
        playBtn.disabled = false;
        setStatus("idle", "Idle");
      }
    }
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

  function trackUsage(eventType, team) {
    const u = window.PlayDelayUsage;
    if (!u || typeof u.track !== "function") return;
    const t = team || currentTeam;
    u.track(eventType, {
      team_id: t.id,
      team_label: t.label,
    });
  }

  function teamLogoHtml(espnId, size) {
    if (registry && typeof registry.logoImgHtml === "function") {
      return registry.logoImgHtml(espnId, size);
    }
    if (!espnId) return "";
    const s = size || 36;
    const url =
      "https://a.espncdn.com/i/teamlogos/ncaa/500/" +
      encodeURIComponent(String(espnId)) +
      ".png";
    return (
      '<img class="team-logo" src="' +
      url +
      '" alt="" width="' +
      s +
      '" height="' +
      s +
      '" loading="lazy" decoding="async" onerror="this.hidden=true">'
    );
  }

  const PICKER_EXPANDED_KEY = "playdelay.teamPickerExpanded";
  const FAV_STORAGE_KEY = "playdelay.favoriteTeams";
  const FAV_PROMPTED_KEY = "playdelay.favoritesPrompted";
  const FAV_MIN = 1;
  const FAV_MAX = 12;
  const FAV_RECOMMENDED = 8;

  const DEFAULT_FAVORITES =
    (registry && registry.FAVORITE_ORDER && registry.FAVORITE_ORDER.slice()) || [
      "byu",
      "utah",
      "asu",
      "usc",
      "miami",
      "arizona",
    ];

  /** @type {string[]} */
  let favoriteIds = DEFAULT_FAVORITES.slice();
  /** @type {string[]} */
  let draftFavoriteIds = [];
  let favoritesPanelMode = "edit"; // "edit" | "prompt"

  function readPickerExpanded() {
    try {
      return localStorage.getItem(PICKER_EXPANDED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function persistPickerExpanded(expanded) {
    try {
      localStorage.setItem(PICKER_EXPANDED_KEY, expanded ? "1" : "0");
    } catch (_) {}
  }

  function sanitizeFavoriteIds(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = new Set();
    for (const item of raw) {
      const id = String(item || "").trim();
      if (!id || !TEAMS[id] || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= FAV_MAX) break;
    }
    return out;
  }

  function readLocalFavorites() {
    try {
      const raw = localStorage.getItem(FAV_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const ids = sanitizeFavoriteIds(parsed);
      return ids.length ? ids : null;
    } catch (_) {
      return null;
    }
  }

  function writeLocalFavorites(ids) {
    const cleaned = sanitizeFavoriteIds(ids);
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(cleaned));
    } catch (_) {}
    return cleaned;
  }

  function wasFavoritesPrompted() {
    try {
      return localStorage.getItem(FAV_PROMPTED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markFavoritesPrompted() {
    try {
      localStorage.setItem(FAV_PROMPTED_KEY, "1");
    } catch (_) {}
  }

  function getActiveFavorites() {
    return favoriteIds.length ? favoriteIds : DEFAULT_FAVORITES.slice();
  }

  function teamButtonHtml(id) {
    const t = TEAMS[id];
    if (!t) return "";
    const live = t.streamUrl ? ' data-has-stream="1"' : ' data-has-stream="0"';
    const label = t.shortLabel || t.label;
    return (
      '<button type="button" class="btn btn-team" data-team="' +
      id +
      '"' +
      live +
      ' aria-pressed="false">' +
      label +
      "</button>"
    );
  }

  function wireTeamButtons(buttons) {
    (buttons || []).forEach((btn) => {
      btn.addEventListener("click", () => {
        selectTeam(btn.dataset.team);
      });
    });
  }

  function rebuildTeamPicker() {
    teamButtons = buildTeamPicker() || [];
    wireTeamButtons(teamButtons);
    applyTeamBranding(currentTeam);
  }

  function conferenceSectionsHtml(excludeSet) {
    const groupOrder =
      (registry && registry.GROUP_ORDER) || ["big12", "bigten", "acc"];
    const labels =
      (registry && registry.GROUP_LABELS) || {
        big12: "Big 12",
        bigten: "Big Ten",
        acc: "ACC",
      };
    const parts = [];
    for (const group of groupOrder) {
      const ids =
        registry && typeof registry.idsForGroup === "function"
          ? registry.idsForGroup(group)
          : [];
      const visible = ids.filter(
        (id) => TEAMS[id] && (!excludeSet || !excludeSet.has(id))
      );
      if (!visible.length) continue;
      parts.push(
        '<div class="team-picker-group" data-group="' + group + '">'
      );
      parts.push(
        '<div class="team-picker-label">' +
          (labels[group] || group) +
          "</div>"
      );
      parts.push('<div class="team-picker-grid">');
      for (const id of visible) {
        parts.push(teamButtonHtml(id));
      }
      parts.push("</div></div>");
    }
    return parts.join("");
  }

  function buildTeamPicker() {
    if (!teamToggle) return;
    const favorites = getActiveFavorites();
    const favSet = new Set(favorites);
    const moreHtml = conferenceSectionsHtml(favSet);
    const expanded = readPickerExpanded();
    const parts = [];

    parts.push('<div class="team-picker-group" data-group="favorites">');
    parts.push('<div class="team-picker-label">Favorites</div>');
    parts.push('<div class="team-picker-grid">');
    for (const id of favorites) {
      parts.push(teamButtonHtml(id));
    }
    parts.push("</div></div>");

    if (moreHtml) {
      parts.push(
        '<div class="team-picker-group team-picker-more' +
          (expanded ? " is-expanded" : "") +
          '" data-group="more">'
      );
      parts.push(
        '<button type="button" class="btn team-picker-expand" id="teamPickerExpand" aria-expanded="' +
          (expanded ? "true" : "false") +
          '">' +
          (expanded ? "Hide teams" : "More teams") +
          "</button>"
      );
      parts.push(
        '<div class="team-picker-more-body"' +
          (expanded ? "" : " hidden") +
          ">"
      );
      parts.push(moreHtml);
      parts.push("</div></div>");
    }

    teamToggle.innerHTML = parts.join("");

    const expandBtn = document.getElementById("teamPickerExpand");
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const group = expandBtn.closest(".team-picker-more");
        const body = group && group.querySelector(".team-picker-more-body");
        if (!group || !body) return;
        const next = !group.classList.contains("is-expanded");
        group.classList.toggle("is-expanded", next);
        body.hidden = !next;
        expandBtn.setAttribute("aria-expanded", next ? "true" : "false");
        expandBtn.textContent = next ? "Hide teams" : "More teams";
        persistPickerExpanded(next);
      });
    }

    // Refresh nodelist after rebuild
    return Array.from(teamToggle.querySelectorAll("[data-team]"));
  }

  function favoritesPanelEls() {
    return {
      panel: document.getElementById("favoritesPanel"),
      list: document.getElementById("favoritesList"),
      note: document.getElementById("favoritesPanelNote"),
      err: document.getElementById("favoritesError"),
      saveBtn: document.getElementById("favoritesSaveBtn"),
      laterBtn: document.getElementById("favoritesLaterBtn"),
      closeBtn: document.getElementById("favoritesCloseBtn"),
      title: document.getElementById("favoritesPanelTitle"),
    };
  }

  function renderFavoritesList() {
    const { list } = favoritesPanelEls();
    if (!list) return;
    const groupOrder =
      (registry && registry.GROUP_ORDER) || ["big12", "bigten", "acc"];
    const labels =
      (registry && registry.GROUP_LABELS) || {
        big12: "Big 12",
        bigten: "Big Ten",
        acc: "ACC",
      };
    const selected = new Set(draftFavoriteIds);
    const parts = [];
    for (const group of groupOrder) {
      const ids =
        registry && typeof registry.idsForGroup === "function"
          ? registry.idsForGroup(group)
          : [];
      const present = ids.filter((id) => TEAMS[id]);
      if (!present.length) continue;
      parts.push('<div class="favorites-group" data-group="' + group + '">');
      parts.push(
        '<div class="team-picker-label">' + (labels[group] || group) + "</div>"
      );
      parts.push('<div class="favorites-group-grid">');
      for (const id of present) {
        const t = TEAMS[id];
        const on = selected.has(id);
        const label = t.shortLabel || t.label;
        parts.push(
          '<button type="button" class="btn btn-team favorites-toggle' +
            (on ? " is-active" : "") +
            '" data-fav-team="' +
            id +
            '" aria-pressed="' +
            (on ? "true" : "false") +
            '">' +
            label +
            "</button>"
        );
      }
      parts.push("</div></div>");
    }
    list.innerHTML = parts.join("");
    list.querySelectorAll("[data-fav-team]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-fav-team");
        const idx = draftFavoriteIds.indexOf(id);
        if (idx >= 0) {
          draftFavoriteIds.splice(idx, 1);
        } else {
          if (draftFavoriteIds.length >= FAV_MAX) {
            const { err } = favoritesPanelEls();
            if (err) {
              err.textContent = "Max " + FAV_MAX + " favorites. Deselect one first.";
              err.hidden = false;
            }
            return;
          }
          draftFavoriteIds.push(id);
        }
        const { err } = favoritesPanelEls();
        if (err) err.hidden = true;
        updateFavoritesNote();
        renderFavoritesList();
      });
    });
    updateFavoritesNote();
  }

  function updateFavoritesNote() {
    const { note } = favoritesPanelEls();
    if (!note) return;
    const n = draftFavoriteIds.length;
    let msg =
      "Pick " +
      FAV_MIN +
      "–" +
      FAV_MAX +
      " teams (about " +
      FAV_RECOMMENDED +
      " is ideal). They show first in the picker.";
    if (n) {
      msg = n + " selected · recommended ~" + FAV_RECOMMENDED + " (max " + FAV_MAX + ").";
      if (n > FAV_RECOMMENDED) {
        msg += " A shorter list is easier on game day.";
      }
    }
    note.textContent = msg;
  }

  function openFavoritesPanel(mode) {
    const els = favoritesPanelEls();
    if (!els.panel) return;
    favoritesPanelMode = mode || "edit";
    draftFavoriteIds = getActiveFavorites().slice();
    if (els.title) {
      els.title.textContent =
        favoritesPanelMode === "prompt" ? "Pick your favorite teams" : "Your favorites";
    }
    if (els.laterBtn) {
      els.laterBtn.hidden = favoritesPanelMode !== "prompt";
    }
    if (els.err) els.err.hidden = true;
    renderFavoritesList();
    els.panel.hidden = false;
    document.body.classList.add("favorites-panel-open");
  }

  function closeFavoritesPanel() {
    const els = favoritesPanelEls();
    if (!els.panel) return;
    els.panel.hidden = true;
    document.body.classList.remove("favorites-panel-open");
  }

  async function saveFavoritesFromPanel() {
    const els = favoritesPanelEls();
    const cleaned = sanitizeFavoriteIds(draftFavoriteIds);
    if (cleaned.length < FAV_MIN) {
      if (els.err) {
        els.err.textContent = "Pick at least " + FAV_MIN + " team.";
        els.err.hidden = false;
      }
      return;
    }
    if (els.saveBtn) {
      els.saveBtn.disabled = true;
      els.saveBtn.textContent = "Saving…";
    }
    if (els.err) els.err.hidden = true;
    try {
      favoriteIds = writeLocalFavorites(cleaned);
      const auth = window.PlayDelayAuth;
      if (auth && typeof auth.updateFavoriteTeamIds === "function") {
        const saved = await auth.updateFavoriteTeamIds(favoriteIds);
        favoriteIds = writeLocalFavorites(saved.length ? saved : favoriteIds);
      }
      markFavoritesPrompted();
      rebuildTeamPicker();
      closeFavoritesPanel();
      showToast("Favorites saved");
    } catch (e) {
      console.warn("save favorites", e);
      // Keep local mirror even if remote fails
      favoriteIds = writeLocalFavorites(cleaned);
      markFavoritesPrompted();
      rebuildTeamPicker();
      if (els.err) {
        els.err.textContent =
          (e && e.message) || "Saved on this device; cloud sync failed.";
        els.err.hidden = false;
      } else {
        closeFavoritesPanel();
        showToast("Favorites saved on this device");
      }
    } finally {
      if (els.saveBtn) {
        els.saveBtn.disabled = false;
        els.saveBtn.textContent = "Save favorites";
      }
    }
  }

  function wireFavoritesUi() {
    const editBtn = document.getElementById("editFavoritesBtn");
    const els = favoritesPanelEls();
    if (editBtn) {
      editBtn.addEventListener("click", () => openFavoritesPanel("edit"));
    }
    if (els.closeBtn) {
      els.closeBtn.addEventListener("click", () => {
        markFavoritesPrompted();
        closeFavoritesPanel();
      });
    }
    if (els.laterBtn) {
      els.laterBtn.addEventListener("click", () => {
        markFavoritesPrompted();
        closeFavoritesPanel();
      });
    }
    if (els.saveBtn) {
      els.saveBtn.addEventListener("click", () => {
        saveFavoritesFromPanel();
      });
    }
    if (els.panel) {
      els.panel.addEventListener("click", (e) => {
        if (e.target === els.panel) {
          markFavoritesPrompted();
          closeFavoritesPanel();
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.panel || els.panel.hidden) return;
      markFavoritesPrompted();
      closeFavoritesPanel();
    });
  }

  async function loadUserFavorites() {
    const local = readLocalFavorites();
    if (local) favoriteIds = local;
    else favoriteIds = DEFAULT_FAVORITES.slice();

    const auth = window.PlayDelayAuth;
    if (!auth || typeof auth.fetchFavoriteTeamIds !== "function") {
      return { needsPrompt: !local && !wasFavoritesPrompted() };
    }
    try {
      const remote = await auth.fetchFavoriteTeamIds();
      const remoteIds = sanitizeFavoriteIds(remote && remote.ids);
      if (remoteIds.length) {
        favoriteIds = writeLocalFavorites(remoteIds);
        return { needsPrompt: false };
      }
      // Server empty: keep local if present, else defaults + soft prompt
      if (local && local.length) {
        // Push local mirror up so profile stays in sync
        try {
          if (typeof auth.updateFavoriteTeamIds === "function") {
            await auth.updateFavoriteTeamIds(local);
          }
        } catch (e) {
          console.warn("sync local favorites", e);
        }
        return { needsPrompt: false };
      }
      return { needsPrompt: !wasFavoritesPrompted() };
    } catch (e) {
      console.warn("load favorites", e);
      return { needsPrompt: !local && !wasFavoritesPrompted() };
    }
  }

  function applyTeamBranding(team) {
    document.documentElement.dataset.team = team.id;
    document.body.dataset.team = team.id;
    if (registry && typeof registry.applyThemeVars === "function") {
      registry.applyThemeVars(team);
    }
    if (brandMarkEl) {
      const label = team.shortLabel || team.label;
      const logo = teamLogoHtml(team.espnId, 40);
      if (logo) {
        brandMarkEl.innerHTML =
          logo.replace('class="team-logo"', 'class="team-logo brand-logo"') +
          '<span class="brand-mark-text" hidden>' +
          label +
          "</span>";
        const img = brandMarkEl.querySelector("img.brand-logo");
        if (img) {
          img.alt = label;
          img.addEventListener("error", () => {
            img.hidden = true;
            const span = brandMarkEl.querySelector(".brand-mark-text");
            if (span) span.hidden = false;
          });
        }
      } else {
        brandMarkEl.textContent = label;
      }
    }
    if (stationTitleEl) {
      stationTitleEl.textContent = team.streamUrl
        ? team.station
        : team.label + " · schedule";
    }
    document.title = team.title;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const color =
        (team.theme && team.theme.themeColor) || "#0a1628";
      themeMeta.setAttribute("content", color);
    }
    teamButtons.forEach((btn) => {
      const active = btn.dataset.team === team.id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (teamToggle) {
      teamToggle.setAttribute("data-active", team.id);
      const activeBtn = teamToggle.querySelector(
        '[data-team="' + team.id + '"]'
      );
      // If active team is in collapsed More, expand so it is reachable
      if (activeBtn) {
        const moreGroup = activeBtn.closest(".team-picker-more");
        if (moreGroup && !moreGroup.classList.contains("is-expanded")) {
          const expandBtn = moreGroup.querySelector(".team-picker-expand");
          const body = moreGroup.querySelector(".team-picker-more-body");
          moreGroup.classList.add("is-expanded");
          if (body) body.hidden = false;
          if (expandBtn) {
            expandBtn.setAttribute("aria-expanded", "true");
            expandBtn.textContent = "Hide teams";
          }
          persistPickerExpanded(true);
        }
        if (typeof activeBtn.scrollIntoView === "function") {
          try {
            activeBtn.scrollIntoView({ block: "nearest", inline: "nearest" });
          } catch (_) {}
        }
      }
    }
  }

  function cacheBustStreamUrl(url) {
    if (!url) return url;
    const sep = url.indexOf("?") >= 0 ? "&" : "?";
    return url + sep + "_=" + Date.now();
  }

  /** Seek near the live edge when the element is seekable; return true if seek applied. */
  function seekToLiveEdge(el) {
    try {
      if (!el || !el.seekable || el.seekable.length === 0) return false;
      const end = el.seekable.end(el.seekable.length - 1);
      if (!Number.isFinite(end) || end <= 0) return false;
      const target = Math.max(0, end - 0.25);
      el.currentTime = target;
      return true;
    } catch (_) {
      return false;
    }
  }

  function clearStallTimer() {
    if (stallTimer) {
      window.clearTimeout(stallTimer);
      stallTimer = 0;
    }
  }

  function pruneReconnectAttempts(now) {
    const cutoff = now - RECONNECT_WINDOW_MS;
    reconnectAttemptAt = reconnectAttemptAt.filter((t) => t >= cutoff);
  }

  function recordReconnectAttempt() {
    const now = Date.now();
    pruneReconnectAttempts(now);
    if (reconnectAttemptAt.length >= RECONNECT_MAX) return false;
    reconnectAttemptAt.push(now);
    return true;
  }

  function shouldAutoReconnect() {
    return (
      isPlaying &&
      !switchingTeam &&
      !reconnecting &&
      hasStream()
    );
  }

  /**
   * Full reconnect: tear down MediaElementSource / worklet like team-switch,
   * attach a fresh cache-busted Amperwave URL, restore delay + volume, resume play.
   */
  async function reconnectFresh(reason) {
    if (!shouldAutoReconnect()) return false;
    if (!recordReconnectAttempt()) {
      giveUpReconnect();
      return false;
    }

    reconnecting = true;
    clearStallTimer();
    livePlaybackStarted = false;
    lastMediaTime = NaN;
    const keptDelay = targetDelay;
    const keptWorkletFailed = workletFailed;
    const keptFailReason = workletFailReason;

    showToast("Reconnecting to live…");
    setStatus("loading", "Loading");
    showBanner("", false);
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.textContent = "Pause";

    try {
      window.clearTimeout(silenceWatch);
      if (audio) {
        try {
          audio.pause();
        } catch (_) {}
      }
      await teardownGraph();

      // Prefer prior path: worklet if it had been working; else direct.
      try {
        if (!keptWorkletFailed) {
          await startWorkletPlay();
        } else {
          await startDirectPlay(keptFailReason || reason);
        }
      } catch (err) {
        console.warn("Reconnect worklet/direct failed, trying direct", err);
        await startDirectPlay(
          reason ||
            "Stream stalled. Reconnected with live playback."
        );
      }

      if (usingWorklet) {
        targetDelay = keptDelay;
        displayDelay = keptDelay;
        sendDelayToWorklet(keptDelay);
        updateDelayUI();
      }
      applyVolume();

      isPlaying = true;
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.textContent = "Pause";
      setStatus("live", "Live");
      return true;
    } catch (err) {
      console.error("reconnectFresh", err);
      // Keep play intent when budget remains; retry shortly or give up at cap.
      if (reconnectBudgetExceeded()) {
        giveUpReconnect();
      } else {
        setStatus("loading", "Loading");
        window.setTimeout(() => {
          if (isPlaying && !switchingTeam && !reconnecting && hasStream()) {
            reconnectFresh(reason || "retry");
          }
        }, 750);
      }
      return false;
    } finally {
      reconnecting = false;
    }
  }

  function reconnectBudgetExceeded() {
    pruneReconnectAttempts(Date.now());
    return reconnectAttemptAt.length >= RECONNECT_MAX;
  }

  function giveUpReconnect() {
    clearStallTimer();
    livePlaybackStarted = false;
    isPlaying = false;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.textContent = "Play";
    setStatus("error", "Error");
    showBanner("Stream error. Tap Play to retry.", true);
  }

  /** Stall/waiting recovery: seek to live if possible, else full reconnect. */
  async function recoverLivePlayback(reason) {
    if (!shouldAutoReconnect() || !livePlaybackStarted) return;
    if (reconnectBudgetExceeded()) {
      giveUpReconnect();
      return;
    }

    if (seekToLiveEdge(audio)) {
      reconnectAttemptAt.push(Date.now());
      showToast("Reconnecting to live…");
      setStatus("loading", "Loading");
      try {
        if (audio.paused) await audio.play();
      } catch (err) {
        console.warn("seek-to-live play failed; full reconnect", err);
        await reconnectFresh(reason || "seek-to-live failed");
      }
      return;
    }

    await reconnectFresh(reason || "stream stall");
  }

  function armStallReconnect() {
    if (!shouldAutoReconnect() || !livePlaybackStarted) return;
    if (stallTimer) return;
    stallTimer = window.setTimeout(() => {
      stallTimer = 0;
      if (!shouldAutoReconnect() || !livePlaybackStarted) return;
      // Still waiting/stalled if not making progress
      recoverLivePlayback("waiting/stalled");
    }, STALL_RECONNECT_MS);
  }

  function freshAudio(crossOrigin) {
    const el = document.createElement("audio");
    el.id = "audio";
    el.preload = "auto";
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    if (crossOrigin) el.crossOrigin = "anonymous";
    const url = streamUrl();
    if (url) el.src = cacheBustStreamUrl(url);
    // Replace previous element (MediaElementSource permanently captures one)
    if (audio && audio.parentNode) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.replaceWith(el);
    } else if (audioHost && audioHost.parentNode && audio === audioHost) {
      audioHost.replaceWith(el);
    } else {
      document.body.appendChild(el);
    }
    wireAudioEvents(el);
    audio = el;
    return el;
  }

  function setStatus(kind, label) {
    statusChip.textContent = label;
    statusChip.className = "status-chip status-" + kind;
  }

  function showBanner(message, isError) {
    bannerEl.hidden = !message;
    bannerEl.textContent = message || "";
    bannerEl.classList.toggle("banner-error", !!isError);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 3600);
  }

  function formatDelay(seconds) {
    const s = Math.max(0, Math.min(MAX_DELAY, seconds));
    if (s < 0.05) return "Live";
    if (Math.abs(s - Math.round(s)) < 0.05) return Math.round(s) + "s";
    return s.toFixed(1) + "s";
  }

  function updateDelayUI() {
    delayValueEl.textContent = formatDelay(
      usingWorklet ? displayDelay : targetDelay
    );
    presetButtons.forEach((btn) => {
      const v = Number(btn.dataset.delay);
      const active =
        (v === 0 && targetDelay < 0.05) ||
        (v > 0 && Math.abs(targetDelay - v) < 0.05);
      btn.classList.toggle("is-active", active);
    });
  }

  function applyVolume() {
    const vol = Number(volumeEl.value);
    const muted = muteBtn.getAttribute("aria-pressed") === "true";
    if (usingWorklet && gainNode && audioCtx) {
      gainNode.gain.value = muted ? 0 : vol;
      audio.muted = false; // MES routes to graph; do not mute element (silences input in some browsers)
      audio.volume = 1;
    } else {
      audio.muted = muted;
      audio.volume = muted ? 0 : vol;
    }
  }

  function setMute(muted) {
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.textContent = muted ? "Unmute" : "Mute";
    applyVolume();
  }

  function sendDelayToWorklet(seconds) {
    if (!delayNode) return;
    delayNode.port.postMessage({ type: "setDelay", seconds });
  }

  function rememberDelayPreference(seconds) {
    const auth = window.PlayDelayAuth;
    if (!auth || typeof auth.setPrefs !== "function") return;
    const session =
      typeof auth.getSession === "function" ? auth.getSession() : null;
    // getSession may be async in current auth; only sync prefs objects work
    if (!session || typeof session.then === "function" || !session.email) return;
    auth.setPrefs(session.email, { lastDelay: seconds });
  }

  function restoreDelayPreference() {
    const auth = window.PlayDelayAuth;
    if (!auth || typeof auth.getPrefs !== "function") return;
    const session =
      typeof auth.getSession === "function" ? auth.getSession() : null;
    if (!session || typeof session.then === "function" || !session.email) return;
    const prefs = auth.getPrefs(session.email);
    if (typeof prefs.lastDelay === "number" && prefs.lastDelay >= 0) {
      setDelay(prefs.lastDelay, { fromUser: false });
    }
  }

  function setDelay(seconds, { fromUser = true } = {}) {
    const next = Math.max(0, Math.min(MAX_DELAY, seconds));

    if (!usingWorklet && fromUser && next > 0) {
      showToast(
        workletFailReason ||
          "Delay needs Web Audio. Playing live sound only — delay the TV if radio is behind."
      );
      showBanner(
        "Playing without delay engine. Live audio still works. If radio is ahead of TV, we need CORS-friendly Web Audio; otherwise delay the TV.",
        false
      );
      targetDelay = 0;
      displayDelay = 0;
      updateDelayUI();
      return;
    }

    targetDelay = next;
    if (!usingWorklet) displayDelay = next;
    if (usingWorklet) sendDelayToWorklet(next);
    updateDelayUI();
    if (fromUser) rememberDelayPreference(next);
  }

  async function teardownGraph() {
    window.clearTimeout(silenceWatch);
    try {
      if (sourceNode) sourceNode.disconnect();
    } catch (_) {}
    try {
      if (delayNode) delayNode.disconnect();
    } catch (_) {}
    try {
      if (gainNode) gainNode.disconnect();
    } catch (_) {}
    try {
      if (analyser) analyser.disconnect();
    } catch (_) {}
    sourceNode = null;
    delayNode = null;
    gainNode = null;
    analyser = null;
    usingWorklet = false;
    if (audioCtx) {
      try {
        if (audioCtx.state !== "closed") await audioCtx.close();
      } catch (_) {}
      audioCtx = null;
    }
  }

  function rmsLevel() {
    if (!analyser) return 0;
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  async function startDirectPlay(reason) {
    await teardownGraph();
    workletFailed = true;
    workletFailReason =
      reason ||
      "Web Audio delay unavailable for this stream. Live radio still plays.";
    freshAudio(false);
    applyVolume();
    await audio.play();
    usingWorklet = false;
    showBanner(
      "Live sound on (no delay engine). Tap delay later if we get Web Audio working — or delay the TV when radio is behind.",
      false
    );
  }

  async function startWorkletPlay() {
    await teardownGraph();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("No AudioContext");

    audioCtx = new Ctx();
    if (!workletModuleLoaded) {
      await audioCtx.audioWorklet.addModule(WORKLET_URL);
      workletModuleLoaded = true;
    } else {
      // New context needs the module again
      await audioCtx.audioWorklet.addModule(WORKLET_URL);
    }

    freshAudio(true);
    applyVolume();

    sourceNode = audioCtx.createMediaElementSource(audio);
    delayNode = new AudioWorkletNode(audioCtx, "delay-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    gainNode = audioCtx.createGain();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    delayNode.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === "delay" && typeof data.current === "number") {
        displayDelay = data.current;
        updateDelayUI();
      }
    };

    sourceNode.connect(delayNode);
    delayNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    usingWorklet = true;
    workletFailed = false;
    sendDelayToWorklet(targetDelay);
    applyVolume();

    if (audioCtx.state === "suspended") await audioCtx.resume();
    await audio.play();

    // If graph is silent (CORS / empty buffers), fall back to direct play.
    window.clearTimeout(silenceWatch);
    silenceWatch = window.setTimeout(async () => {
      if (!isPlaying || !usingWorklet) return;
      const level = rmsLevel();
      if (level < 0.01) {
        console.warn("Worklet path silent (rms=" + level + "); falling back");
        const wasPlaying = isPlaying;
        try {
          await startDirectPlay(
            "Stream blocked Web Audio (often CORS). Switched to live element playback so you still hear radio."
          );
          if (wasPlaying) {
            isPlaying = true;
            playBtn.setAttribute("aria-pressed", "true");
            playBtn.textContent = "Pause";
            setStatus("live", "Live");
            targetDelay = 0;
            displayDelay = 0;
            updateDelayUI();
          }
        } catch (e) {
          console.error(e);
          setStatus("error", "Error");
          showBanner("Could not recover audio. Tap Play again.", true);
        }
      }
    }, 2000);
  }

  async function play() {
    if (!hasStream()) {
      updateStreamAvailability();
      showToast(currentTeam.label + " radio stream coming soon");
      return;
    }
    setStatus("loading", "Loading");
    playBtn.disabled = true;
    showBanner("", false);

    try {
      // Prefer delay engine first; silence watchdog falls back to direct audio.
      try {
        await startWorkletPlay();
      } catch (err) {
        console.warn("Worklet play failed, direct fallback", err);
        await startDirectPlay(
          "Could not start delay engine. Playing live radio without delay."
        );
      }

      isPlaying = true;
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.textContent = "Pause";
      setStatus("live", "Live");
      reconnectAttemptAt = [];
      trackUsage("play", currentTeam);
      if (!usingWorklet) {
        targetDelay = 0;
        displayDelay = 0;
        updateDelayUI();
      }
    } catch (err) {
      console.error(err);
      isPlaying = false;
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Play";
      setStatus("error", "Error");
      showBanner(
        "Could not start the stream. Check connection and tap Play again.",
        true
      );
    } finally {
      playBtn.disabled = false;
    }
  }

  function pause() {
    window.clearTimeout(silenceWatch);
    clearStallTimer();
    livePlaybackStarted = false;
    lastMediaTime = NaN;
    audio.pause();
    isPlaying = false;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.textContent = "Play";
    setStatus("paused", "Paused");
    trackUsage("stop", currentTeam);
  }

  async function togglePlay() {
    if (isPlaying && !audio.paused) pause();
    else await play();
  }

  async function selectTeam(teamId, { autoResume = true } = {}) {
    const next = TEAMS[teamId];
    if (!next || next.id === currentTeam.id) return;
    if (switchingTeam) return;
    switchingTeam = true;

    const wasPlaying = isPlaying;
    const keptDelay = targetDelay;

    try {
      window.clearTimeout(silenceWatch);
      clearStallTimer();
      livePlaybackStarted = false;
      lastMediaTime = NaN;
      if (audio) {
        try {
          audio.pause();
        } catch (_) {}
      }
      await teardownGraph();
      isPlaying = false;
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Play";
      setStatus("idle", "Idle");

      currentTeam = next;
      persistTeam(next.id);
      applyTeamBranding(next);
      trackUsage("select", next);
      refreshSchedule();
      workletFailed = false;
      workletFailReason = "";

      // Keep delay setting across teams when reasonable
      targetDelay = keptDelay;
      displayDelay = keptDelay;
      updateDelayUI();

      if (hasStream()) {
        freshAudio(false);
        applyVolume();
        showToast(next.label + " · " + next.station);
        updateStreamAvailability();
        if (autoResume && wasPlaying) {
          await play();
        }
      } else {
        if (audio) {
          try {
            audio.removeAttribute("src");
            audio.load();
          } catch (_) {}
        }
        showToast(next.label + " · schedule only");
        updateStreamAvailability();
      }
    } finally {
      switchingTeam = false;
    }
  }

  function wireAudioEvents(el) {
    el.addEventListener("waiting", () => {
      if (!isPlaying || switchingTeam || reconnecting) return;
      setStatus("loading", "Loading");
      armStallReconnect();
    });
    el.addEventListener("stalled", () => {
      if (!isPlaying || switchingTeam || reconnecting) return;
      setStatus("loading", "Loading");
      armStallReconnect();
    });
    el.addEventListener("playing", () => {
      if (!isPlaying) return;
      clearStallTimer();
      livePlaybackStarted = true;
      lastMediaTime = el.currentTime;
      setStatus("live", "Live");
    });
    el.addEventListener("canplay", () => {
      if (!isPlaying) return;
      clearStallTimer();
    });
    el.addEventListener("timeupdate", () => {
      if (!isPlaying) return;
      const t = el.currentTime;
      if (Number.isFinite(t) && (Number.isNaN(lastMediaTime) || t !== lastMediaTime)) {
        lastMediaTime = t;
        clearStallTimer();
        livePlaybackStarted = true;
      }
    });
    el.addEventListener("ended", () => {
      if (!isPlaying || switchingTeam || reconnecting) return;
      // Live mounts should not end; treat as drop and reconnect.
      clearStallTimer();
      reconnectFresh("ended");
    });
    el.addEventListener("error", () => {
      if (switchingTeam || reconnecting) return;
      if (!isPlaying || !hasStream()) {
        setStatus("error", "Error");
        showBanner("Stream error. Tap Play to retry.", true);
        isPlaying = false;
        playBtn.setAttribute("aria-pressed", "false");
        playBtn.textContent = "Play";
        return;
      }
      clearStallTimer();
      reconnectFresh("error");
    });
  }

  playBtn.addEventListener("click", () => {
    togglePlay();
  });

  muteBtn.addEventListener("click", () => {
    const muted = muteBtn.getAttribute("aria-pressed") !== "true";
    setMute(muted);
  });

  volumeEl.addEventListener("input", () => {
    if (
      muteBtn.getAttribute("aria-pressed") === "true" &&
      Number(volumeEl.value) > 0
    ) {
      setMute(false);
    }
    applyVolume();
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDelay(Number(btn.dataset.delay)));
  });

  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () =>
      setDelay(targetDelay + Number(btn.dataset.delta))
    );
  });

  // Snappy first paint from localStorage / defaults, then sync from Supabase
  const localFavBoot = readLocalFavorites();
  if (localFavBoot) favoriteIds = localFavBoot;

  teamButtons = buildTeamPicker() || [];
  wireTeamButtons(teamButtons);
  wireFavoritesUi();

  wireAudioEvents(audio);
  applyTeamBranding(currentTeam);
  refreshSchedule();
  updateStreamAvailability();
  // Initial select event for persisted team (schedule_view also from schedule.js)
  trackUsage("select", currentTeam);
  // Initial element: prepare src without capturing yet
  audio.preload = "auto";
  if (hasStream()) audio.src = cacheBustStreamUrl(streamUrl());

  document.addEventListener("keydown", (event) => {
    const tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const favPanel = document.getElementById("favoritesPanel");
    if (favPanel && !favPanel.hidden) return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "m" || event.key === "M") {
      event.preventDefault();
      setMute(muteBtn.getAttribute("aria-pressed") !== "true");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setDelay(targetDelay + 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setDelay(targetDelay - 1);
    }
  });

  setStatus("idle", "Idle");
  updateDelayUI();
  applyVolume();
  restoreDelayPreference();

  loadUserFavorites()
    .then((result) => {
      rebuildTeamPicker();
      if (result && result.needsPrompt) {
        openFavoritesPanel("prompt");
      }
    })
    .catch((e) => console.warn("favorites boot", e));
})();
