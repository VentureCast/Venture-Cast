"""
Scrape TwitchTracker ranking pages for the top 1000 streamers,
then batch-fetch Twitch Helix for channel IDs.

20 pages × 50 channels = 1000 streamers.
Only 20 web requests + ~10 Helix batch calls = ~30 total requests.
"""

import json
import os
import re
import time
import requests
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from twitch_data_fetcher import get_access_token

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}

PAGES_NEEDED = 20
DELAY_BETWEEN_PAGES = 25


def parse_number(raw: str) -> Optional[int]:
    """Strip non-numeric chars and return an int, or None."""
    cleaned = re.sub(r"[^\d]", "", raw.strip())
    return int(cleaned) if cleaned else None


def parse_hours_streamed(raw: str) -> Optional[float]:
    """Parse '194.3hours' into a float."""
    m = re.search(r"([\d.]+)", raw)
    return float(m.group(1)) if m else None


def scrape_ranking_page(page: int) -> List[Dict[str, Any]]:
    """
    Scrape one TwitchTracker ranking page. Returns list of dicts with:
    login, display_name, rank, avg_viewers, hours_streamed,
    peak_viewers_alltime, hours_watched, followers_gained, followers_total, total_views
    """
    url = f"https://twitchtracker.com/channels/ranking?page={page}"

    for attempt in range(6):
        try:
            resp = requests.get(url, headers=_BROWSER_HEADERS, timeout=30)
            if resp.status_code == 200:
                break
            if resp.status_code == 429:
                wait = 15 * (attempt + 1)
                print(f"    ⏳ Page {page} rate-limited, waiting {wait}s …")
                time.sleep(wait)
                continue
            print(f"⚠️  Page {page} returned HTTP {resp.status_code}")
            return []
        except Exception as e:
            print(f"⚠️  Error fetching page {page}: {e}")
            return []
    else:
        print(f"⚠️  Gave up on page {page} after retries")
        return []

    text = resp.text

    tbody_start = text.find("<tbody")
    tbody_end = text.find("</tbody>", tbody_start)
    if tbody_start < 0 or tbody_end < 0:
        print(f"⚠️  No table body found on page {page}")
        return []
    tbody = text[tbody_start:tbody_end]

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbody, re.DOTALL)
    results: List[Dict[str, Any]] = []

    for row in rows:
        login_match = re.search(r'href="/(\w+)"', row)
        if not login_match:
            continue
        login = login_match.group(1)

        tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL)
        if len(tds) < 10:
            continue

        strip = lambda s: re.sub(r"<[^>]+>", "", s).strip()

        display_name = strip(tds[2])
        rank = parse_number(tds[0])
        avg_viewers = parse_number(tds[3])
        hours_streamed = parse_hours_streamed(strip(tds[4]))
        peak_viewers_alltime = parse_number(tds[5])
        hours_watched = parse_number(tds[6])
        followers_gained = parse_number(tds[8])
        followers_total = parse_number(tds[9])

        results.append({
            "login": login,
            "display_name": display_name,
            "rank": rank,
            "avg_viewers": avg_viewers,
            "hours_streamed": hours_streamed,
            "peak_viewers_alltime": peak_viewers_alltime,
            "hours_watched": hours_watched,
            "followers_gained": followers_gained,
            "followers_total": followers_total,
        })

    return results


def fetch_users_batch(
    logins: List[str], client_id: str, access_token: str
) -> Dict[str, Dict[str, Any]]:
    """Batch-fetch Twitch Helix user objects (up to 100 per call)."""
    url = "https://api.twitch.tv/helix/users"
    headers = {
        "Client-ID": client_id,
        "Authorization": f"Bearer {access_token}",
    }
    results: Dict[str, Dict[str, Any]] = {}

    for i in range(0, len(logins), 100):
        batch = logins[i : i + 100]
        params = [("login", name) for name in batch]
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code == 200:
                for user in resp.json().get("data", []):
                    results[user["login"].lower()] = user
            else:
                print(f"⚠️  Helix users API returned HTTP {resp.status_code}")
        except Exception as e:
            print(f"⚠️  Error fetching users batch: {e}")
        time.sleep(0.5)

    return results


def main():
    client_id = os.getenv("TWITCH_CLIENT_ID", "zzsh4vqpt1cv0hp1ia01kd8d5ts3k9")
    client_secret = os.getenv(
        "TWITCH_CLIENT_SECRET", "d1g4b82crv41hmkgw0j6yymj1oimvf"
    )
    access_token = get_access_token(client_id, client_secret)
    if not access_token:
        print("❌ Could not obtain Twitch access token.")
        return

    # --- Phase 1: Scrape ranking pages ---
    print(f"📊 Scraping {PAGES_NEEDED} TwitchTracker ranking pages …\n")
    all_channels: List[Dict[str, Any]] = []

    for page in range(1, PAGES_NEEDED + 1):
        print(f"  📄 Page {page}/{PAGES_NEEDED} …", end=" ", flush=True)
        rows = scrape_ranking_page(page)
        all_channels.extend(rows)
        print(f"got {len(rows)} channels (total: {len(all_channels)})")

        if page < PAGES_NEEDED:
            time.sleep(DELAY_BETWEEN_PAGES)

    print(f"\n✅ Scraped {len(all_channels)} channels from ranking pages\n")

    # --- Phase 2: Batch-fetch Twitch Helix for channel IDs ---
    logins = [ch["login"] for ch in all_channels]
    print(f"📡 Batch-fetching Twitch Helix user info for {len(logins)} channels …")
    user_map = fetch_users_batch(logins, client_id, access_token)
    print(f"   Resolved {len(user_map)} channel IDs\n")

    # --- Phase 3: Merge and output ---
    results: List[Dict[str, Any]] = []
    for ch in all_channels:
        user = user_map.get(ch["login"].lower())
        channel_id = user["id"] if user else None

        minutes_streamed = None
        if ch["hours_streamed"] is not None:
            minutes_streamed = round(ch["hours_streamed"] * 60)

        entry = {
            "channel_name": ch["display_name"],
            "channel_id": channel_id,
            "platform": "Twitch",
            "followers": ch["followers_total"],
            "past_30_days": {
                "rank": ch["rank"],
                "avg_viewers": ch["avg_viewers"],
                "peak_viewers_alltime": ch["peak_viewers_alltime"],
                "hours_watched": ch["hours_watched"],
                "minutes_streamed": minutes_streamed,
                "hours_streamed": ch["hours_streamed"],
                "followers_gained": ch["followers_gained"],
            },
        }
        results.append(entry)

    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "period": "past_30_days",
        "source": "twitchtracker_ranking_pages",
        "total_streamers": len(results),
        "streamers": results,
    }

    out_file = f"twitch_top{len(results)}_stats_scraped.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved {len(results)} streamers to {out_file}")


if __name__ == "__main__":
    main()
