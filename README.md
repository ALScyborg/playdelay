# PlayDelay BYU (v2)

Static PlayDelay site for Brad: landing page + BYU / **KSL NewsRadio** player with browser delay (AudioWorklet). Huge tap targets, dark BYU navy theme with gold accents. **No login wall** — Play and delay work fully while signed out.

## Station

- **KSL NewsRadio — BYU**
- Stream: `https://bonneville.cdnstream1.com/2704_48.aac`

## Open / serve

Must be served over **http(s)** (not `file://`) so the AudioWorklet module can load.

```bash
cd /workspace/playdelay-v2
python3 -m http.server 8765
```

Then open:

- Landing: **http://127.0.0.1:8765/**
- Player: **http://127.0.0.1:8765/player.html**
- Demo sign-in: **http://127.0.0.1:8765/login.html**

Or any static host (nginx, `npx serve`, GitHub Pages, etc.) pointing at this folder.

Live site: **https://alscyborg.github.io/playdelay/**

### Add to home screen (iOS / Android)

Open the **player** in Safari/Chrome → Share / menu → **Add to Home Screen**. Manifest `start_url` is `player.html`; name: **BYU Radio**.

## Landing

`index.html` introduces PlayDelay: hero illustration (SVG), CTA to the BYU player, three how-it-works steps with icons (watch TV → play KSL → dial delay), BYU/KSL-only note, footer `support@playdelay.app`.

## Optional demo auth

Sign in is **optional** and never blocks the player.

- Header **Sign in** on landing and player → `login.html` (email + password + Continue / Create account)
- **Demo-only**: accounts live in `localStorage`; passwords are SHA-256 hashed in-browser (not a real backend)
- When signed in: header shows email + **Sign out**
- Preference stub: last delay preset is remembered per signed-in email in `localStorage`
- Do **not** use real passwords — this is a prototype pattern

**Future:** replace with Firebase Auth or Supabase Auth + remote prefs. Keep the same UI hooks in `auth.js` (`PlayDelayAuth`).

## Controls (player)

| Control | Action |
| --- | --- |
| Play / Pause | Start or stop the stream |
| Mute | Toggle mute |
| Live, 5s, 8s, 10s, 15s | Delay presets |
| −10s −1s +1s +10s | Nudge delay (max 120s) |
| Space | Play / pause |
| M | Mute |
| ↑ / ↓ | ±1s delay |

## CORS caveat (Bonneville stream)

Delay uses Web Audio (`createMediaElementSource` + AudioWorklet). That path requires the stream to allow CORS (`Access-Control-Allow-Origin`) because `audio.crossOrigin = "anonymous"`.

- If Bonneville **sends** CORS headers for your origin → delay works.
- If CORS is **missing or blocked** → the player falls back to plain `<audio>` element playback (**live only**), shows a clear banner, and keeps delay buttons tappable (toast explains why delay cannot apply). Buttons are never grayed into a “dead” state.

Local preview on `127.0.0.1` may differ from a deployed HTTPS origin depending on the CDN’s CORS policy.

## Files

- `index.html` — landing page (hero SVG + how-it-works icons)
- `player.html` — BYU / KSL player UI (optional accent art; auth does not gate Play)
- `login.html` — demo email/password create + sign-in
- `auth.js` — demo localStorage auth + prefs helpers
- `app.js` — playback + delay engine wiring (sound-first fallback; remembers delay when signed in)
- `styles.css` — shared tokens; player + landing + auth styles
- `assets/` — original SVG art (navy / white / gold): `hero-sync.svg`, `icon-tv.svg`, `icon-radio.svg`, `icon-delay.svg`, `player-accent.svg`
- `worklets/delay-processor.js` — AudioWorklet ring-buffer delay (SNAP >1.5s, maxRampRate 0.15)
- `manifest.webmanifest` — PWA “BYU Radio” (`start_url`: player.html)
