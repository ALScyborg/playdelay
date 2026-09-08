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
