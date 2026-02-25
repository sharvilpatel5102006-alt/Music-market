# Music Market UI

A minimal Robinhood-style web interface for a simulated artist stock market.

## Run locally (with listener API)

```bash
cd "/Users/sharvilpatel/Documents/Music project "
python3 server.py
```

Open <http://127.0.0.1:8000>

Default mode is `THIRD_PARTY_PROVIDER=mock`.

## Third-party listener providers

The frontend calls `GET /api/artist-metrics?artist=...`.

### Songstats mode

```bash
THIRD_PARTY_PROVIDER=songstats \
SONGSTATS_API_KEY="<your_key>" \
SONGSTATS_URL_TEMPLATE="https://<songstats-endpoint>?artist={artist}" \
python3 server.py
```

### Chartmetric mode

```bash
THIRD_PARTY_PROVIDER=chartmetric \
CHARTMETRIC_REFRESH_TOKEN="<your_refresh_token>" \
python3 server.py
```

Optional Chartmetric URL overrides:

- `CHARTMETRIC_TOKEN_URL`
- `CHARTMETRIC_SEARCH_URL`
- `CHARTMETRIC_STATS_URL_TEMPLATE` (must include `{artist_id}`)

Notes:

- Third-party API schemas vary by plan/account; if a response shape differs, update the parser in `server.py` (`find_first_number`).
- If provider calls fail, UI falls back to synthetic listener values so the app remains usable.

## Deploy to GitHub Pages

GitHub Pages can host only static files. To use real third-party listener metrics in production, host `server.py` on a backend platform and point the frontend to that API domain.
