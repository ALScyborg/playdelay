# PlayDelay (BYU)

Landing + KSL player. **Sign in with email + access code `1234`** (stores email in the browser). No Supabase.

Live: https://alscyborg.github.io/playdelay/

## Local

```bash
python3 -m http.server 8765
```

- http://127.0.0.1:8765/
- http://127.0.0.1:8765/login.html
- http://127.0.0.1:8765/player.html (redirects to login if needed)

## Access

- Email: any valid address (collected in `localStorage`)
- PIN: `1234`
