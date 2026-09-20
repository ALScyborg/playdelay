/**
 * PlayDelay ads — loads Google AdSense only when ADSENSE_CLIENT is set.
 * Paste your publisher id (ca-pub-XXXXXXXX) into ADSENSE_CLIENT after AdSense approval.
 */
(() => {
  "use strict";
  const ADSENSE_CLIENT = ""; // e.g. "ca-pub-1234567890"
  if (!ADSENSE_CLIENT) return;

  const s = document.createElement("script");
  s.async = true;
  s.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
    encodeURIComponent(ADSENSE_CLIENT);
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);

  document.querySelectorAll(".pd-ad[data-ad-slot]").forEach((el) => {
    const slot = el.getAttribute("data-ad-slot");
    if (!slot) return;
    el.innerHTML =
      '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
      ADSENSE_CLIENT +
      '" data-ad-slot="' +
      slot +
      '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  });
})();
