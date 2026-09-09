/**
 * PlayDelay — fire-and-forget team usage events → Supabase REST.
 * Table: public.team_usage_events
 */
(() => {
  "use strict";

  const SUPABASE_URL = "https://itcgsbzcopdkccobcfha.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Y2dzYnpjb3Bka2Njb2JjZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzEwOTksImV4cCI6MjEwNDQwNzA5OX0.OFiNUkxAV4XDIgGVzbcKhSywcibcXnNM8Xts1KnEVE8";
  const SESSION_KEY = "playdelay.sessionId";

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (id && id.length >= 8) return id;
      id = uuid();
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (_) {
      return uuid();
    }
  }

  function currentUserId() {
    try {
      const auth = window.PlayDelayAuth;
      if (!auth) return null;
      // Prefer sync session reader if present
      if (typeof auth.getSession === "function") {
        const s = auth.getSession();
        if (s && typeof s.then !== "function") {
          return (s.user && s.user.id) || null;
        }
      }
      const raw = localStorage.getItem("playdelay.supabase.session");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return (parsed && parsed.user && parsed.user.id) || null;
    } catch (_) {
      return null;
    }
  }

  function currentSport() {
    try {
      const sched = window.PlayDelaySchedule;
      if (sched && typeof sched.readSport === "function") {
        return sched.readSport();
      }
      const raw = localStorage.getItem("playdelay.lastSport");
      if (raw === "football" || raw === "mbb") return raw;
    } catch (_) {}
    return "football";
  }

  /**
   * @param {"select"|"play"|"stop"|"schedule_view"} eventType
   * @param {{ team_id?: string, team_label?: string, sport?: string, user_id?: string|null }} [extra]
   */
  function track(eventType, extra) {
    try {
      const payload = {
        team_id: (extra && extra.team_id) || "",
        team_label: (extra && extra.team_label) || "",
        event_type: eventType,
        sport: (extra && extra.sport) || currentSport(),
        user_id: (extra && extra.user_id !== undefined
          ? extra.user_id
          : currentUserId()) || null,
        session_id: getSessionId(),
        page_url: typeof location !== "undefined" ? location.href : "",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      };
      if (!payload.team_id) return;

      // Fire-and-forget — never block UI
      fetch(SUPABASE_URL + "/rest/v1/team_usage_events", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  window.PlayDelayUsage = {
    track,
    getSessionId,
  };
})();
