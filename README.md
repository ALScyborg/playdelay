# PlayDelay (Big 12 + Big Ten + ACC + SEC)

Landing + delay player for the **Big 12**, **Big Ten**, **ACC**, **SEC**, and independent **Notre Dame**. Football & men’s basketball schedules via ESPN. **Radio live** where a flagship station publishes a stream the browser can play. **Kansas State** stays coming-soon (SurferNetwork returns 401). **Ole Miss** is not listed (WOXF 105.1 has no public mount). **Free for now:** create a Supabase account, sign in, pick a team, then play.

- Live (GitHub Pages): https://alscyborg.github.io/playdelay/
- Custom domain: https://playdelay.app/

## Flow

1. Open the site → **Sign in / Sign up** (`login.html`)
2. Create an account with email + password (min 6 characters), or sign in
3. You’re sent to **`player.html`** — favorites first, then more teams organized by conference (Big 12 / Big Ten / ACC / SEC / Independents); Play when a stream is available (no payment gate right now)

## Auth

- Supabase project ref: `itcgsbzcopdkccobcfha`
- Frontend uses the public anon key only (see `supabase-auth.js` / `usage.js`)
- Session stored in `localStorage` (`playdelay.supabase.session`)
- Last team stored in `localStorage` (`playdelay.lastTeam`) — accepts every id in `teams.js`
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
- Sports: college football (`season=2026`) and men’s college basketball (ESPN ending year — `season=2027` is 2026-27, including non-conference). Basketball’s year advances each July; football stays on `FOOTBALL_SEASON`.
- Huge Football | Basketball toggle; landing uses team chips + one schedule panel.
- Times displayed in the user's local timezone.
- Basketball uses the same flagship radio streams as football when a stream exists.

## Notes

- Stripe / paid unlock is **not** required in this build (may return later).
- Do not put service-role or Stripe secret keys in this repo.
- ASU (KMVP): game-day geo blackouts may apply outside Phoenix; the continuous mount may still work.
- USC (KSPN): Amperwave redirects with session tokens — keep the stable `live.amperwave.net/direct/...` URL only.
- Nebraska (KLIN): StreamTheWorld `KLINAMAAC.aac` redirect (same pattern as Arizona KCUB).
- Live streams auto-reconnect on stall/error (fresh Amperwave session URL, seek-to-live when seekable); capped at 5 attempts / 60s, then the usual error banner.
- Teams with `streamUrl: null` (currently Kansas State) show a coming-soon banner; Play enables wherever a stream is set.
- Indiana plays 93.1 WIBC. The Bloomington flagship WHCC 105.1 has no public mount; WIBC carries the full football broadcast.
- Missouri (KTGR) may geo-limit game audio near Columbia. The continuous mount is what the player opens.
- Florida State football is 94.9 TNT WTNT. Men’s basketball on that network is 100.7 WFLA, which is not the stream in the player.
