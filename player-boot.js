/**
 * PlayDelay — Supabase Auth via fetch (no CDN). Free access after login.
 */
(() => {
  const SUPABASE_URL = "https://itcgsbzcopdkccobcfha.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Y2dzYnpjb3Bka2Njb2JjZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzEwOTksImV4cCI6MjEwNDQwNzA5OX0.OFiNUkxAV4XDIgGVzbcKhSywcibcXnNM8Xts1KnEVE8";
  const STORAGE_KEY = "playdelay.supabase.session";

  function authHeaders(extra) {
    const h = {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
    };
    if (extra) Object.assign(h, extra);
    return h;
  }

  function saveSession(session) {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function getSession() {
    const session = readSession();
    if (!session || !session.access_token) return null;
    // Light expiry check
    if (session.expires_at && session.expires_at * 1000 < Date.now() - 30000) {
      if (session.refresh_token) {
        try {
          return await refreshSession(session.refresh_token);
        } catch {
          saveSession(null);
          return null;
        }
      }
      saveSession(null);
      return null;
    }
    return session;
  }

  async function refreshSession(refreshToken) {
    const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Session expired");
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      token_type: data.token_type,
      user: data.user,
    };
    saveSession(session);
    return session;
  }

  async function getUser() {
    const session = await getSession();
    return (session && session.user) || null;
  }

  async function signUp(email, password) {
    const res = await fetch(SUPABASE_URL + "/auth/v1/signup", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Sign up failed");
    if (data.access_token) {
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user,
      };
      saveSession(session);
      return { user: data.user, session };
    }
    return { user: data.user || data, session: null };
  }

  async function signIn(email, password) {
    const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Sign in failed");
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      token_type: data.token_type,
      user: data.user,
    };
    saveSession(session);
    return { user: data.user, session };
  }

  async function signOut() {
    const session = readSession();
    saveSession(null);
    if (session && session.access_token) {
      try {
        await fetch(SUPABASE_URL + "/auth/v1/logout", {
          method: "POST",
          headers: authHeaders({ Authorization: "Bearer " + session.access_token }),
        });
      } catch (_) {}
    }
  }

  async function requireSessionOrRedirect(nextPage) {
    const session = await getSession();
    if (!session || !session.user) {
      const next = nextPage || "player.html";
      location.replace("login.html?next=" + encodeURIComponent(next));
      return null;
    }
    return session.user;
  }

  async function routeAfterAuth() {
    const user = await getUser();
    if (!user) {
      location.replace("login.html");
      return;
    }
    location.replace("player.html");
  }


  const FREE_UNTIL_ISO = "2026-09-15T07:00:00.000Z";
  const FREE_UNTIL_MS = Date.parse(FREE_UNTIL_ISO);

  function isFreeWeekend() {
    return Date.now() < FREE_UNTIL_MS;
  }

  async function fetchProfileCredits() {
    const session = await getSession();
    if (!session || !session.access_token || !session.user) return null;
    const uid = session.user.id;
    const url =
      SUPABASE_URL +
      "/rest/v1/profiles?select=game_credits,games_used&id=eq." +
      encodeURIComponent(uid) +
      "&limit=1";
    const res = await fetch(url, {
      headers: authHeaders({
        Authorization: "Bearer " + session.access_token,
      }),
    });
    if (!res.ok) return null;
    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows) || !rows.length) {
      return { game_credits: 0, games_used: 0 };
    }
    const row = rows[0] || {};
    return {
      game_credits: Number(row.game_credits) || 0,
      games_used: Number(row.games_used) || 0,
    };
  }

  window.PlayDelayAuth = {
    getSession,
    getUser,
    signUp,
    signIn,
    signOut,
    requireSessionOrRedirect,
    routeAfterAuth,
    FREE_UNTIL_ISO,
    isFreeWeekend,
    fetchProfileCredits,
  };
})();
/**
 * player.html — require Supabase session, then load app.js. Free (no paywall).
 */
(() => {
  const auth = window.PlayDelayAuth;
  if (!auth) {
    console.error("PlayDelayAuth missing");
    location.replace("login.html?next=player.html");
    return;
  }

  function loadApp() {
    if (document.getElementById("playdelay-app-script")) return;
    const s = document.createElement("script");
    s.id = "playdelay-app-script";
    s.src = "app.js";
    s.defer = true;
    document.body.appendChild(s);
  }

  function formatCreditsLabel(profile) {
    if (auth.isFreeWeekend && auth.isFreeWeekend()) {
      return "Free weekend";
    }
    const n = profile && typeof profile.game_credits === "number" ? profile.game_credits : 0;
    if (n === 1) return "1 game left";
    return n + " games left";
  }

  async function wireCreditsChip() {
    const chip = document.getElementById("creditsChip");
    if (!chip) return;
    try {
      if (auth.isFreeWeekend && auth.isFreeWeekend()) {
        chip.textContent = "Free weekend";
        chip.hidden = false;
        chip.classList.add("credits-chip-free");
        return;
      }
      const profile = await auth.fetchProfileCredits();
      chip.textContent = formatCreditsLabel(profile);
      chip.hidden = false;
      chip.classList.toggle("credits-chip-free", false);
    } catch (e) {
      console.warn("credits chip", e);
      chip.hidden = true;
    }
  }

  function wireSession(user) {
    const chip = document.getElementById("sessionChip");
    const emailEl = document.getElementById("sessionEmail");
    const outBtn = document.getElementById("signOutBtn");
    if (chip && emailEl) {
      emailEl.textContent = (user && user.email) || "";
      chip.hidden = false;
    }
    if (outBtn) {
      outBtn.addEventListener("click", async () => {
        await auth.signOut();
        location.replace("login.html?next=player.html");
      });
    }
    wireCreditsChip();
  }

  (async () => {
    const user = await auth.requireSessionOrRedirect("player.html");
    if (!user) return;
    wireSession(user);
    loadApp();
  })().catch((e) => {
    console.error(e);
    location.replace("login.html?next=player.html");
  });
})();
