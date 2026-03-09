import argparse
import os
import json
import re
import time
import requests
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from twitch_data_fetcher import get_access_token

DEFAULT_CHANNEL_NAMES = [
    "xQc",
    "HasanAbi",
    "Northernlion",
    "shroud",
    "sodapoppin",
    "summit1g",
    "Caedrel",
    "DougDoug",
    "pokimane",
    "Ludwig",
]

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}


def parse_duration(duration_str: str) -> Optional[int]:
    """Parse Twitch duration string (e.g., '2h30m45s') into total seconds."""
    if not duration_str:
        return None
    pattern = r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?"
    match = re.match(pattern, duration_str)
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    total = hours * 3600 + minutes * 60 + seconds
    return total if total > 0 else None


def format_duration(total_seconds: int) -> str:
    """Format seconds into a human-readable string like '5h 23m 10s'."""
    if total_seconds <= 0:
        return "0s"
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if seconds > 0 or not parts:
        parts.append(f"{seconds}s")
    return " ".join(parts)


def make_headers(client_id: str, access_token: str) -> Dict[str, str]:
    return {
        "Accept": "application/json",
        "User-Agent": "VentureCast/1.0",
        "Client-ID": client_id,
        "Authorization": f"Bearer {access_token}",
    }


def fetch_users_batch(
    logins: List[str], client_id: str, access_token: str
) -> Dict[str, Dict[str, Any]]:
    """Fetch user objects for up to 100 logins in a single request."""
    url = "https://api.twitch.tv/helix/users"
    headers = make_headers(client_id, access_token)
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
                print(f"⚠️  Users API returned HTTP {resp.status_code}")
        except Exception as e:
            print(f"⚠️  Error fetching users: {e}")
        time.sleep(0.5)

    return results


def fetch_follower_count(
    broadcaster_id: str, client_id: str, access_token: str
) -> Optional[int]:
    """
    Attempt to get follower count from helix/channels/followers.

    This endpoint requires a user access token with moderator:read:followers
    scope for the full list, but the `total` field may be returned with an
    app access token when no user_id filter is specified.  Returns None when
    the endpoint denies access.
    """
    url = "https://api.twitch.tv/helix/channels/followers"
    headers = make_headers(client_id, access_token)
    params = {"broadcaster_id": broadcaster_id, "first": 1}
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=20)
        if resp.status_code == 200:
            return resp.json().get("total")
    except Exception:
        pass
    return None


def fetch_twitchtracker_summary(
    channel_name: str, max_retries: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Fetch the 30-day channel summary from the public TwitchTracker API
    with retry + exponential backoff for 429 responses.
    """
    url = f"https://twitchtracker.com/api/channels/summary/{channel_name.lower()}"
    headers = {
        "User-Agent": _BROWSER_HEADERS["User-Agent"],
        "Accept": "application/json",
        "Referer": f"https://twitchtracker.com/{channel_name.lower()}",
    }
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                wait = 10 * (attempt + 1)
                print(f"    ⏳ TT API 429 for {channel_name}, retry in {wait}s …")
                time.sleep(wait)
                continue
            print(
                f"⚠️  TwitchTracker API returned HTTP {resp.status_code} for {channel_name}"
            )
            return None
        except Exception as e:
            print(f"⚠️  TwitchTracker API error for {channel_name}: {e}")
            return None
    print(f"⚠️  TwitchTracker API: gave up after {max_retries} retries for {channel_name}")
    return None


def scrape_ranking_page(page: int = 1) -> List[Dict[str, Any]]:
    """
    Scrape a single TwitchTracker ranking page and return a list of
    { login, display_name, rank } dicts.  Only names are extracted here;
    all stats come from APIs later.
    """
    url = f"https://twitchtracker.com/channels/ranking?page={page}"
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=_BROWSER_HEADERS, timeout=30)
            if resp.status_code == 200:
                break
            if resp.status_code == 429:
                wait = 8 * (attempt + 1)
                print(f"    ⏳ Ranking page {page} rate-limited, waiting {wait}s …")
                time.sleep(wait)
                continue
            print(f"⚠️  Ranking page {page} returned HTTP {resp.status_code}")
            return []
        except Exception as e:
            print(f"⚠️  Error fetching ranking page {page}: {e}")
            return []
    else:
        return []

    text = resp.text
    table_start = text.find('id="channels"')
    if table_start < 0:
        return []

    tbody_start = text.find("<tbody", table_start)
    tbody_end = text.find("</tbody>", tbody_start)
    tbody = text[tbody_start:tbody_end]

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbody, re.DOTALL)
    results: List[Dict[str, Any]] = []

    for row in rows:
        name_match = re.search(r'href="/(\w+)"[^>]*target="_blank">\w', row)
        if not name_match:
            continue
        login = name_match.group(1)

        display_match = re.search(r'target="_blank">([^<]+)</a>', row)
        display_name = display_match.group(1).strip() if display_match else login

        rank_match = re.search(r"#(\d+)", row)
        rank = int(rank_match.group(1)) if rank_match else None

        results.append(
            {"login": login, "display_name": display_name, "rank": rank}
        )

    return results


def scrape_top_n_rankings(n: int = 1000) -> List[Dict[str, Any]]:
    """Scrape multiple ranking pages to collect the top N streamers."""
    pages_needed = (n + 49) // 50
    all_channels: List[Dict[str, Any]] = []

    for page in range(1, pages_needed + 1):
        print(f"  📄 Scraping ranking page {page}/{pages_needed} …")
        rows = scrape_ranking_page(page)
        all_channels.extend(rows)
        if len(all_channels) >= n:
            break
        time.sleep(5)

    return all_channels[:n]


def fetch_videos_past_month(
    broadcaster_id: str, client_id: str, access_token: str
) -> List[Dict[str, Any]]:
    """Fetch all past-broadcast VODs created within the last 30 days."""
    url = "https://api.twitch.tv/helix/videos"
    headers = make_headers(client_id, access_token)
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    all_videos: List[Dict[str, Any]] = []
    cursor = None

    while True:
        params: Dict[str, Any] = {
            "user_id": broadcaster_id,
            "type": "archive",
            "first": 100,
        }
        if cursor:
            params["after"] = cursor

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code != 200:
                print(f"⚠️  Videos API returned HTTP {resp.status_code} for {broadcaster_id}")
                break

            data = resp.json()
            videos = data.get("data", [])
            if not videos:
                break

            for video in videos:
                created_at = video.get("created_at", "")
                try:
                    created_dt = datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    )
                    if created_dt >= cutoff:
                        all_videos.append(video)
                    else:
                        return all_videos
                except Exception:
                    all_videos.append(video)

            pagination = data.get("pagination", {})
            cursor = pagination.get("cursor")
            if not cursor:
                break
        except Exception as e:
            print(f"⚠️  Error fetching videos for {broadcaster_id}: {e}")
            break

    return all_videos


def build_streamer_stats(
    channel_names: List[str], client_id: str, access_token: str
) -> List[Dict[str, Any]]:
    print("📡 Fetching user info …")
    user_map = fetch_users_batch(channel_names, client_id, access_token)

    results: List[Dict[str, Any]] = []

    for name in channel_names:
        key = name.lower()
        user = user_map.get(key)
        if not user:
            print(f"❌ Channel '{name}' not found — skipping")
            results.append(
                {
                    "channel_name": name,
                    "channel_id": None,
                    "platform": "Twitch",
                    "error": "Channel not found",
                }
            )
            continue

        channel_id = user["id"]
        display_name = user["display_name"]
        print(f"  Processing {display_name} (ID: {channel_id}) …")

        followers = fetch_follower_count(channel_id, client_id, access_token)
        time.sleep(0.3)

        videos = fetch_videos_past_month(channel_id, client_id, access_token)
        time.sleep(0.3)

        stream_count = len(videos)
        total_seconds = 0
        for v in videos:
            dur = parse_duration(v.get("duration", ""))
            if dur:
                total_seconds += dur

        avg_seconds = total_seconds // stream_count if stream_count > 0 else 0

        tt_summary = fetch_twitchtracker_summary(display_name)
        time.sleep(1)

        past_30: Dict[str, Any] = {
            "streams_count": stream_count,
            "total_duration_seconds": total_seconds,
            "total_duration_formatted": format_duration(total_seconds),
            "average_duration_seconds": avg_seconds,
            "average_duration_formatted": format_duration(avg_seconds),
        }

        if tt_summary:
            past_30.update(
                {
                    "rank": tt_summary.get("rank"),
                    "avg_viewers": tt_summary.get("avg_viewers"),
                    "peak_viewers": tt_summary.get("max_viewers"),
                    "hours_watched": tt_summary.get("hours_watched"),
                    "minutes_streamed": tt_summary.get("minutes_streamed"),
                    "followers_gained": tt_summary.get("followers"),
                }
            )

        entry: Dict[str, Any] = {
            "channel_name": display_name,
            "channel_id": channel_id,
            "platform": "Twitch",
            "followers": followers,
            "past_30_days": past_30,
        }

        if tt_summary:
            print(
                f"    ✅ {display_name}: {stream_count} streams, "
                f"total {format_duration(total_seconds)}, "
                f"avg {format_duration(avg_seconds)} | "
                f"viewers: avg {tt_summary.get('avg_viewers')}, "
                f"peak {tt_summary.get('max_viewers')}, "
                f"rank #{tt_summary.get('rank')}"
            )
        else:
            print(
                f"    ✅ {display_name}: {stream_count} streams, "
                f"total {format_duration(total_seconds)}, "
                f"avg {format_duration(avg_seconds)} | "
                f"viewers: unavailable"
            )

        results.append(entry)

    return results


def build_top_n_stats(
    n: int,
    client_id: str,
    access_token: str,
    preloaded: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch stats for a list of channels via APIs.  If *preloaded* is given
    the scraping step is skipped entirely.  Otherwise the TwitchTracker
    ranking pages are scraped for the top N names first.
    """
    if preloaded:
        ranked = preloaded
    else:
        print(f"📊 Scraping TwitchTracker rankings for top {n} names …")
        ranked = scrape_top_n_rankings(n)
        print(f"   Got {len(ranked)} channel names from rankings\n")

        names_file = f"twitch_top{n}_names.json"
        with open(names_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "count": len(ranked),
                    "channels": ranked,
                },
                f,
                indent=2,
                ensure_ascii=False,
            )
        print(f"💾 Channel names saved to {names_file}\n")

    logins = [r["login"] for r in ranked]
    rank_map = {r["login"].lower(): r["rank"] for r in ranked}

    print("📡 Batch-fetching Twitch user info …")
    user_map = fetch_users_batch(logins, client_id, access_token)
    print(f"   Resolved {len(user_map)} channel IDs\n")

    total = len(ranked)
    out_file = f"twitch_top{total}_stats.json"
    print(f"📹 Fetching data via APIs (Twitch Helix + TwitchTracker) for {total} channels …")
    results: List[Dict[str, Any]] = []

    for i, ch in enumerate(ranked):
        login = ch["login"]
        display_name = ch["display_name"]
        user = user_map.get(login.lower())
        channel_id = user["id"] if user else None

        # --- TwitchTracker summary API (viewer metrics) ---
        tt = fetch_twitchtracker_summary(login)
        time.sleep(6)

        past_30: Dict[str, Any] = {}
        if tt:
            past_30 = {
                "rank": tt.get("rank"),
                "avg_viewers": tt.get("avg_viewers"),
                "peak_viewers": tt.get("max_viewers"),
                "hours_watched": tt.get("hours_watched"),
                "minutes_streamed": tt.get("minutes_streamed"),
                "followers_gained": tt.get("followers"),
            }

        # --- Twitch Helix Videos API (stream count + durations) ---
        if channel_id:
            videos = fetch_videos_past_month(channel_id, client_id, access_token)
            stream_count = len(videos)
            total_seconds = 0
            for v in videos:
                dur = parse_duration(v.get("duration", ""))
                if dur:
                    total_seconds += dur
            avg_seconds = total_seconds // stream_count if stream_count > 0 else 0

            past_30["streams_count"] = stream_count
            past_30["total_duration_seconds"] = total_seconds
            past_30["total_duration_formatted"] = format_duration(total_seconds)
            past_30["average_duration_seconds"] = avg_seconds
            past_30["average_duration_formatted"] = format_duration(avg_seconds)

        followers = tt.get("followers_total") if tt else None

        entry: Dict[str, Any] = {
            "channel_name": display_name,
            "channel_id": channel_id,
            "platform": "Twitch",
            "followers": followers,
            "past_30_days": past_30,
        }
        results.append(entry)

        num = i + 1
        print(f"   [{num}/{total}] {display_name} — {'OK' if tt else 'TT unavailable'}")

        if num % 25 == 0:
            _save_partial(results, out_file, total)

    return results


def _save_partial(
    results: List[Dict[str, Any]], out_file: str, expected_total: int
) -> None:
    """Checkpoint results to disk so progress isn't lost."""
    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "period": "past_30_days",
        "total_streamers": len(results),
        "expected_total": expected_total,
        "partial": True,
        "streamers": results,
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"   💾 Checkpoint saved — {len(results)} streamers so far")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch Twitch streamer stats (default 10 channels, or --top N)"
    )
    parser.add_argument(
        "--top",
        type=int,
        default=0,
        metavar="N",
        help="Scrape TwitchTracker rankings and fetch stats for the top N streamers (e.g. --top 1000)",
    )
    parser.add_argument(
        "--names-file",
        type=str,
        default="",
        metavar="PATH",
        help="Load channel names from an existing JSON file instead of scraping (e.g. twitch_top1000_names.json)",
    )
    args = parser.parse_args()

    client_id = os.getenv("TWITCH_CLIENT_ID", "zzsh4vqpt1cv0hp1ia01kd8d5ts3k9")
    client_secret = os.getenv(
        "TWITCH_CLIENT_SECRET", "d1g4b82crv41hmkgw0j6yymj1oimvf"
    )

    access_token = get_access_token(client_id, client_secret)
    if not access_token:
        print("❌ Could not obtain access token. Exiting.")
        return

    if args.names_file:
        with open(args.names_file, "r", encoding="utf-8") as f:
            names_data = json.load(f)
        ranked = names_data.get("channels", names_data)
        count = len(ranked)
        print(f"🚀 Twitch Streamer Stats — loaded {count} names from {args.names_file}\n")
        streamer_stats = build_top_n_stats(
            0, client_id, access_token, preloaded=ranked
        )
        out_file = f"twitch_top{count}_stats.json"
    elif args.top > 0:
        print(f"🚀 Twitch Top-{args.top} Streamer Stats Fetcher\n")
        streamer_stats = build_top_n_stats(args.top, client_id, access_token)
        out_file = f"twitch_top{args.top}_stats.json"
    else:
        channel_names = DEFAULT_CHANNEL_NAMES
        print("🚀 Twitch Streamer Stats Fetcher")
        print(f"   Channels: {', '.join(channel_names)}\n")
        streamer_stats = build_streamer_stats(channel_names, client_id, access_token)
        out_file = "twitch_streamer_stats.json"

    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "period": "past_30_days",
        "total_streamers": len(streamer_stats),
        "streamers": streamer_stats,
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results saved to {out_file} ({len(streamer_stats)} streamers)")


if __name__ == "__main__":
    main()
