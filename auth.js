/**
 * PlayDelay demo auth — client-side only (localStorage).
 * Demo-only: not secure for production. Replace with Firebase/Supabase later.
 */
(() => {
  "use strict";

  const USERS_KEY = "playdelay_demo_users_v1";
  const SESSION_KEY = "playdelay_demo_session_v1";
  const PREFS_KEY = "playdelay_demo_prefs_v1";

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.email) return null;
      return s;
    } catch (_) {
      return null;
    }
  }

  function setSession(email) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ email: email.toLowerCase(), at: Date.now() })
    );
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getPrefs(email) {
    try {
      const all = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return all[email.toLowerCase()] || {};
    } catch (_) {
      return {};
    }
  }

  function setPrefs(email, patch) {
    const key = email.toLowerCase();
    let all = {};
    try {
      all = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    } catch (_) {}
    all[key] = Object.assign({}, all[key] || {}, patch);
    localStorage.setItem(PREFS_KEY, JSON.stringify(all));
  }

  async function createAccount(email, password) {
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "");
    if (!e || !e.includes("@")) throw new Error("Enter a valid email.");
    if (p.length < 6) throw new Error("Password must be at least 6 characters.");
    const users = loadUsers();
    if (users[e]) throw new Error("Account already exists. Sign in instead.");
    users[e] = { hash: await sha256Hex(p + "::" + e), created: Date.now() };
    saveUsers(users);
    setSession(e);
    return e;
  }

  async function signIn(email, password) {
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "");
    if (!e || !p) throw new Error("Email and password required.");
    const users = loadUsers();
    const user = users[e];
    if (!user) throw new Error("No account found. Create one below.");
    const hash = await sha256Hex(p + "::" + e);
    if (hash !== user.hash) throw new Error("Wrong password.");
    setSession(e);
    return e;
  }

  function signOut() {
    clearSession();
  }

  /** Wire header auth UI if #authSlot exists */
  function mountHeaderAuth() {
    const slot = document.getElementById("authSlot");
    if (!slot) return;

    const session = getSession();
    slot.innerHTML = "";

    if (session) {
      const wrap = document.createElement("div");
      wrap.className = "auth-user";

      const emailEl = document.createElement("span");
      emailEl.className = "auth-email";
      emailEl.textContent = session.email;
      emailEl.title = session.email;

      const outBtn = document.createElement("button");
      outBtn.type = "button";
      outBtn.className = "btn btn-auth";
      outBtn.textContent = "Sign out";
      outBtn.addEventListener("click", () => {
        signOut();
        mountHeaderAuth();
        window.dispatchEvent(new CustomEvent("playdelay:authchange"));
      });

      wrap.appendChild(emailEl);
      wrap.appendChild(outBtn);
      slot.appendChild(wrap);
    } else {
      const link = document.createElement("a");
      link.className = "btn btn-auth";
      link.href = "login.html";
      const ret = encodeURIComponent(
        location.pathname.split("/").pop() || "index.html"
      );
      link.href = "login.html?next=" + ret;
      link.textContent = "Sign in";
      slot.appendChild(link);
    }
  }

  window.PlayDelayAuth = {
    getSession,
    createAccount,
    signIn,
    signOut,
    getPrefs,
    setPrefs,
    mountHeaderAuth,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountHeaderAuth);
  } else {
    mountHeaderAuth();
  }
})();
