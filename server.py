#!/usr/bin/env python3
import json
import os
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
PROVIDER = os.getenv("THIRD_PARTY_PROVIDER", "mock").strip().lower()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_response(handler, status: int, payload: dict) -> None:
    data = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(data)


def get_json(url: str, headers=None, method="GET", body=None):
    req = urllib.request.Request(url, headers=headers or {}, method=method)
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        req.add_header("Content-Type", "application/json")
        req.data = payload

    with urllib.request.urlopen(req, timeout=15) as response:
        text = response.read().decode("utf-8")
        return json.loads(text) if text else {}


def find_first_number(obj):
    candidate_keys = {
        "active_listeners",
        "listeners",
        "listener_count",
        "monthly_listeners",
        "spotify_monthly_listeners",
        "apple_music_listeners",
        "apple_listeners",
        "followers",
    }

    if isinstance(obj, dict):
        for key, value in obj.items():
            if key.lower() in candidate_keys and isinstance(value, (int, float)):
                return int(value)

        for value in obj.values():
            found = find_first_number(value)
            if found is not None:
                return found

    if isinstance(obj, list):
        for item in obj:
            found = find_first_number(item)
            if found is not None:
                return found

    return None


def stable_hash(name: str) -> int:
    total = 0
    for char in name:
        total = (total * 31 + ord(char)) % 1_000_000_007
    return total


def mock_listeners(artist: str):
    seed = stable_hash(artist)
    random.seed(seed + int(time.time() // 60))
    listeners = random.randint(80_000, 7_500_000)
    return listeners, "mock"


def songstats_listeners(artist: str):
    api_key = os.getenv("SONGSTATS_API_KEY", "").strip()
    url_template = os.getenv("SONGSTATS_URL_TEMPLATE", "").strip()

    if not api_key or not url_template:
        raise RuntimeError("set SONGSTATS_API_KEY and SONGSTATS_URL_TEMPLATE")

    url = url_template.replace("{artist}", urllib.parse.quote(artist))
    payload = get_json(url, headers={"Authorization": f"Bearer {api_key}"})
    listeners = find_first_number(payload)

    if listeners is None:
        raise RuntimeError("could not find listeners in Songstats response")

    return listeners, "songstats"


def chartmetric_token():
    refresh_token = os.getenv("CHARTMETRIC_REFRESH_TOKEN", "").strip()
    token_url = os.getenv("CHARTMETRIC_TOKEN_URL", "https://api.chartmetric.com/api/token").strip()

    if not refresh_token:
        raise RuntimeError("set CHARTMETRIC_REFRESH_TOKEN")

    # Chartmetric integrations may expect either key; try both.
    for body in ({"refreshtoken": refresh_token}, {"refresh_token": refresh_token}):
        try:
            payload = get_json(token_url, method="POST", body=body)
            token = payload.get("token") or payload.get("access_token")
            if token:
                return token
        except Exception:
            continue

    raise RuntimeError("unable to acquire Chartmetric token")


def chartmetric_listeners(artist: str):
    search_url = os.getenv("CHARTMETRIC_SEARCH_URL", "https://api.chartmetric.com/api/search").strip()
    stats_template = os.getenv(
        "CHARTMETRIC_STATS_URL_TEMPLATE",
        "https://api.chartmetric.com/api/artist/{artist_id}/stats",
    ).strip()

    token = chartmetric_token()
    headers = {"Authorization": f"Bearer {token}"}

    query = urllib.parse.urlencode({"q": artist, "type": "artists", "limit": 1})
    search_payload = get_json(f"{search_url}?{query}", headers=headers)

    artist_id = None
    if isinstance(search_payload, dict):
        items = search_payload.get("obj") or search_payload.get("data") or []
        if isinstance(items, list) and items:
            artist_id = items[0].get("id")

    if not artist_id:
        raise RuntimeError("artist not found in Chartmetric search")

    stats_url = stats_template.replace("{artist_id}", str(artist_id))
    stats_payload = get_json(stats_url, headers=headers)
    listeners = find_first_number(stats_payload)

    if listeners is None:
        raise RuntimeError("could not find listeners in Chartmetric response")

    return listeners, "chartmetric"


def fetch_listeners(artist: str):
    if PROVIDER == "songstats":
        return songstats_listeners(artist)

    if PROVIDER == "chartmetric":
        return chartmetric_listeners(artist)

    return mock_listeners(artist)


class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path)
        clean = parsed.path.lstrip("/")
        resolved = (ROOT / clean).resolve()

        if ROOT not in resolved.parents and resolved != ROOT:
            return str(ROOT)

        if parsed.path in ("", "/"):
            return str(ROOT / "index.html")

        return str(resolved)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path != "/api/artist-metrics":
            return super().do_GET()

        params = urllib.parse.parse_qs(parsed.query)
        artist = (params.get("artist") or [""])[0].strip()

        if not artist:
            return json_response(self, 400, {"error": "artist query param is required"})

        try:
            listeners, source = fetch_listeners(artist)
            return json_response(
                self,
                200,
                {
                    "artist": artist,
                    "listeners": int(listeners),
                    "source": source,
                    "updatedAt": now_iso(),
                },
            )
        except urllib.error.HTTPError as err:
            return json_response(self, 502, {"error": f"provider HTTP {err.code}"})
        except Exception as err:
            return json_response(self, 502, {"error": str(err)})


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving on http://{HOST}:{PORT} provider={PROVIDER}")
    server.serve_forever()


if __name__ == "__main__":
    main()
