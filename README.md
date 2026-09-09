# PlayDelay (Big 12 + Miami + USC)

Landing + delay player for the full **Big 12**, plus **Miami** and **USC**. Football & men’s basketball schedules via ESPN. **Radio live** for nearly every team — **Kansas State** stays coming-soon (SurferNetwork JWT). **Free for now:** create a Supabase account, sign in, pick a team, then play.

- Live (GitHub Pages): https://alscyborg.github.io/playdelay/
- Custom domain: https://playdelay.app/

## Flow

1. Open the site → **Sign in / Sign up** (`login.html`)
2. Create an account with email + password (min 6 characters), or sign in
3. You’re sent to **`player.html`** — favorites first, then more teams organized by conference (Big 12 / Big Ten / ACC); Play when a stream is available (no payment gate right now)

## Auth

- Supabase project ref: `itcgsbzcopdkccobcfha`
- Frontend uses the public anon key only (see `supabase-auth.js` / `usage.js`)
- Session stored in `localStorage` (`playdelay.supabase.session`)
- Last team stored in `localStorage` (`playdelay.lastTeam`) — accepts all Big 12 / Miami / USC ids
- Last sport stored in `localStorage` (`playdelay.lastSport`: `football` | `mbb`)
- Anonymous usage session id: `playdelay.sessionId`
- Auth is email/password via Supabase Auth HTTP API (no PIN)

## Usage tracking (admin only)

Client fire-and-forget inserts into Supabase `public.team_usage_events` (`select` | `play` | `stop` | `schedule_view`). There is **no** public usage page.

**View in Supabase dashboard:** Table Editor → `team_usage_events`, or views `team_usage_by_team` / `team_usage_summary`.

## Local

```bash
python3 -m http.server 8765
```

- http://127.0.0.1:8765/
- http://127.0.0.1:8765/login.html
- http://127.0.0.1:8765/player.html

## Schedule

- Client-side fetch from ESPN public team schedule JSON (shared ESPN ids for football & MBB).
- Sports: college football (`season=2026`) and men’s college basketball (`season=2026` → 2025-26).
- Huge Football | Basketball toggle; landing uses team chips + one schedule panel.
- Times displayed in the user's local timezone.
- Basketball uses the same flagship radio streams as football when a stream exists.

## Notes

- Stripe / paid unlock is **not** required in this build (may return later).
- Do not put service-role or Stripe secret keys in this repo.
- ASU (KMVP): game-day geo blackouts may apply outside Phoenix; the continuous mount may still work.
- USC (KSPN): Amperwave redirects with session tokens — keep the stable `live.amperwave.net/direct/...` URL only.
- Teams with `streamUrl: null` (currently Kansas State) show a coming-soon banner; Play enables wherever a stream is set.
