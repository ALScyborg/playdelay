/**
 * PlayDelay access gate: collect email, PIN must be 1234.
 * Session in localStorage. No Supabase.
 */
(() => {
  const KEY = "playdelay.session.v1";
  const PIN = "1234";

  function getSession() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.email) return null;
      return s;
    } catch {
      return null;
    }
  }

  function setSession(email) {
    const e = String(email || "").trim().toLowerCase();
    localStorage.setItem(
      KEY,
      JSON.stringify({ email: e, at: Date.now() })
    );
  }

  function clearSession() {
    localStorage.removeItem(KEY);
  }

  function requireSessionOrRedirect() {
    if (getSession()) return true;
    const here = location.pathname.split("/").pop() || "player.html";
    location.replace("login.html?next=" + encodeURIComponent(here));
    return false;
  }

  window.PlayDelayGate = {
    PIN,
    getSession,
    setSession,
    clearSession,
    requireSessionOrRedirect,
    checkPin(pin) {
      return String(pin || "").trim() === PIN;
    },
  };
})();
