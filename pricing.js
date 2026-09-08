/**
 * pricing.html — Stripe payment links + credit readout (no paywall).
 */
(() => {
  "use strict";

  const auth = window.PlayDelayAuth;
  const params = new URLSearchParams(location.search);

  function showSuccess() {
    if (params.get("success") !== "1") return;
    const banner = document.getElementById("successBanner");
    if (!banner) return;
    const n = params.get("credits");
    const creditBit =
      n && /^\d+$/.test(n)
        ? " Thanks — " + n + " credit" + (n === "1" ? "" : "s") + " queued."
        : " Thanks for your purchase.";
    banner.textContent =
      creditBit +
      " Credits will appear on your account when purchases sync; Play is free this weekend.";
    banner.hidden = false;
  }

  async function wireAuthLink() {
    const link = document.getElementById("pricingAuthLink");
    if (!link || !auth) return;
    try {
      const user = await auth.getUser();
      if (user) {
        link.textContent = "Account";
        link.href = "player.html";
        link.title = user.email || "Signed in";
      }
    } catch (_) {}
  }

  async function wireCredits() {
    const panel = document.getElementById("creditsPanel");
    if (!panel || !auth) return;
    try {
      const user = await auth.getUser();
      if (!user) return;
      panel.hidden = false;
      const freeNote = document.getElementById("creditsFreeNote");
      if (freeNote && auth.isFreeWeekend && auth.isFreeWeekend()) {
        freeNote.hidden = false;
      }
      const profile = await auth.fetchProfileCredits();
      const left = document.getElementById("creditsLeft");
      const used = document.getElementById("creditsUsed");
      if (left) left.textContent = String((profile && profile.game_credits) || 0);
      if (used) used.textContent = String((profile && profile.games_used) || 0);
    } catch (e) {
      console.warn("pricing credits", e);
    }
  }

  showSuccess();
  wireAuthLink();
  wireCredits();
})();
