# PlayDelay (BYU, Utah, ASU & USC)

Landing + delay player for **BYU (KSL)**, **Utah (ESPN 700)**, **ASU (Arizona Sports 98.7)**, and **USC (ESPN LA 710)**. Radio streams live for all four teams. **Free for now:** create a Supabase account, sign in, pick a team, then play.

- Live (GitHub Pages): https://alscyborg.github.io/playdelay/
- Custom domain: https://playdelay.app/

## Flow

1. Open the site → **Sign in / Sign up** (`login.html`)
2. Create an account with email + password (min 6 characters), or sign in
3. You’re sent to **`player.html`** — tap **BYU / Utah / ASU / USC**, then Play (no payment gate right now)

## Auth

- Supabase project ref: `itcgsbzcopdkccobcfha`
- Frontend uses the public anon key only (see `supabase-auth.js`)
- Session stored in `localStorage` (`playdelay.supabase.session`)
- Last team stored in `localStorage` (`playdelay.lastTeam`)
- Last sport stored in `localStorage` (`playdelay.lastSport`: `football` | `mbb`)
- Auth is email/password via Supabase Auth HTTP API (no PIN)

## Local

```bash
python3 -m http.server 8765
```

- http://127.0.0.1:8765/
- http://127.0.0.1:8765/login.html
- http://127.0.0.1:8765/player.html

## Schedule

- Client-side fetch from ESPN public team schedule JSON (BYU 252, Utah 254, ASU 9, USC 30).
- Sports: college football (`season=2026`) and men’s college basketball (`season=2026` → 2025-26).
- Huge Football | Basketball toggle on the player schedule panel and landing schedules; preference in `playdelay.lastSport`.
- Times displayed in the user's local timezone.
- Basketball uses the same flagship radio streams as football for now.

## Notes

- Stripe / paid unlock is **not** required in this build (may return later).
- Do not put service-role or Stripe secret keys in this repo.
- ASU (KMVP): game-day geo blackouts may apply outside Phoenix; the continuous mount may still work.
- USC (KSPN): Amperwave redirects with session tokens — keep the stable `live.amperwave.net/direct/...` URL only.
