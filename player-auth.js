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
