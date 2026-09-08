# PlayDelay (BYU)

Static site: landing + BYU / **KSL NewsRadio** player with browser delay (AudioWorklet). Huge tap targets, dark BYU navy theme. **No login.**

Live: https://alscyborg.github.io/playdelay/

## Local

```bash
cd playdelay-v2
python3 -m http.server 8765
```

- Landing: http://127.0.0.1:8765/
- Player: http://127.0.0.1:8765/player.html

Must be served over http(s) (not `file://`) for AudioWorklet.

## Stream

KSL: `https://bonneville.cdnstream1.com/2704_48.aac`

Delay presets snap for jumps over ~1.5s; ±1s eases. If Web Audio/CORS fails, falls back to live `<audio>` with a banner.

## Files

- `index.html` — landing + hero / how-it-works art
- `player.html` — BYU / KSL player
- `app.js` — playback + delay engine wiring
- `styles.css`
- `worklets/delay-processor.js`
- `assets/` — original SVG art
- `manifest.webmanifest` — PWA “BYU Radio”
