"""
Build a Kick streamer stats JSON similar in shape to twitch_top1000_stats_scraped.json.

Data sources (no API key — Kick’s public JSON + channel endpoint):
  • GET https://kick.com/api/v1/categories/top
  • GET https://kick.com/stream/livestreams/{lang}?page=N[&subcategory=slug]
  • GET https://kick.com/stream/featured-livestreams/{lang}
  • GET https://kick.com/api/v2/channels/{slug}

Important limitations vs TwitchTracker-style data:
  • Kick’s public API does not expose past-30-day hours watched, avg CCV, or
    followers gained in bulk. Those fields are set to null below.
  • Channel discovery is a snapshot of who appears in the live directory
    (plus featured rows). We rank the *union* of discovered slugs by
    followers_count and take the top N (default 1000).
  • Big channels that are offline for the whole crawl may be missing; increase
    --pages-per-category / --global-pages or add slugs via --extra-slugs.

Example:
  python3 scrape_kick_top1000.py --top 1000 -o kick_top1000_stats.json
"""

from __future__ import annotations

import argparse
import json
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import requests

_KICK_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Referer": "https://kick.com/",
}

_LANGUAGES = ("en", "es", "fr", "de", "pt", "ja", "ko", "ru", "tr", "it", "pl")


def _get_json(
    url: str, session: requests.Session, timeout: Tuple[float, float] = (5.0, 25.0)
) -> Any:
    r = session.get(url, headers=_KICK_HEADERS, timeout=timeout)
    r.raise_for_status()
    return r.json()


def paginate_livestreams(
    session: requests.Session,
    lang: str,
    subcategory: Optional[str],
    max_pages: int,
    delay: float,
) -> List[Dict[str, Any]]:
    """Return raw livestream rows (dicts) up to max_pages."""
    rows: List[Dict[str, Any]] = []
    for page in range(1, max_pages + 1):
        q = f"https://kick.com/stream/livestreams/{lang}?page={page}"
        if subcategory:
            q += f"&subcategory={subcategory}"
        try:
            data = _get_json(q, session)
        except Exception as e:
            print(f"    ⚠️  livestreams page {page} ({subcategory or 'all'}): {e}")
            break
        batch = data.get("data") or []
        if not batch:
            break
        rows.extend(batch)
        if not data.get("next_page_url"):
            break
        time.sleep(delay)
    return rows


def discover_channels(
    session: requests.Session,
    pages_per_category: int,
    global_pages: int,
    delay: float,
) -> Tuple[Set[str], Dict[str, Dict[str, Any]]]:
    """
    Returns (slugs, meta) where meta[slug] holds max viewer_count seen in crawl
    and optional last session_title.
    """
    slugs: Set[str] = set()
    meta: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"max_viewers_seen": 0, "sample_title": None}
    )

    def note_stream(item: Dict[str, Any]) -> None:
        ch = item.get("channel") or {}
        slug = ch.get("slug")
        if not slug:
            return
        slugs.add(slug)
        vc = item.get("viewer_count") or 0
        try:
            vc = int(vc)
        except (TypeError, ValueError):
            vc = 0
        if vc > meta[slug]["max_viewers_seen"]:
            meta[slug]["max_viewers_seen"] = vc
            meta[slug]["sample_title"] = item.get("session_title")

    print("📡 Featured livestreams (all languages) …", flush=True)
    for lang in _LANGUAGES:
        url = f"https://kick.com/stream/featured-livestreams/{lang}"
        try:
            data = _get_json(url, session)
        except Exception as e:
            print(f"    ⚠️  featured {lang}: {e}", flush=True)
            time.sleep(delay)
            continue
        for item in data.get("data") or []:
            note_stream(item)
        time.sleep(delay)
    print(f"   → {len(slugs)} unique slugs so far", flush=True)

    print("📡 Top categories (English live directory) …", flush=True)
    try:
        cats = _get_json("https://kick.com/api/v1/categories/top", session)
    except Exception as e:
        print(f"❌ categories/top failed: {e}", flush=True)
        cats = []

    for c in cats:
        sub = c.get("slug")
        if not sub:
            continue
        print(
            f"   • {sub} (up to {pages_per_category} pages) …",
            end=" ",
            flush=True,
        )
        try:
            rows = paginate_livestreams(
                session, "en", sub, pages_per_category, delay
            )
        except Exception as e:
            print(f"FAILED ({e})", flush=True)
            continue
        for item in rows:
            note_stream(item)
        print(f"+{len(rows)} rows, total slugs {len(slugs)}", flush=True)
        time.sleep(delay)

    print(f"📡 Global live directory (en, {global_pages} pages) …", flush=True)
    rows = paginate_livestreams(session, "en", None, global_pages, delay)
    for item in rows:
        note_stream(item)
    print(f"   +{len(rows)} rows, total slugs {len(slugs)}")

    return slugs, dict(meta)


def fetch_channel(
    session: requests.Session, slug: str
) -> Optional[Dict[str, Any]]:
    url = f"https://kick.com/api/v2/channels/{slug}"
    try:
        r = session.get(url, headers=_KICK_HEADERS, timeout=25)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def parse_extra_slugs(raw: str) -> Set[str]:
    out: Set[str] = set()
    for part in re.split(r"[\s,]+", raw.strip()):
        p = part.strip().lstrip("@")
        if p:
            out.add(p.lower())
    return out


def build_entry(
    rank: int,
    ch: Dict[str, Any],
    discovery: Dict[str, Any],
) -> Dict[str, Any]:
    user = ch.get("user") or {}
    display = user.get("username") or ch.get("slug")
    live = ch.get("livestream")
    live_now = bool(live)
    current_viewers = None
    session_title = None
    if isinstance(live, dict):
        current_viewers = live.get("viewer_count")
        session_title = live.get("session_title")

    return {
        "channel_name": display,
        "slug": ch.get("slug"),
        "channel_id": str(ch.get("id")) if ch.get("id") is not None else None,
        "platform": "Kick",
        "followers": ch.get("followers_count"),
        "verified": ch.get("verified"),
        "live_now": live_now,
        "current_viewers": current_viewers,
        "session_title": session_title,
        "discovery_snapshot": {
            "max_concurrent_viewers_seen_in_crawl": discovery.get("max_viewers_seen"),
            "sample_session_title_from_crawl": discovery.get("sample_title"),
        },
        "past_30_days": {
            "rank": rank,
            "avg_viewers": None,
            "hours_watched": None,
            "minutes_streamed": None,
            "hours_streamed": None,
            "followers_gained": None,
        },
        "peak_viewers_alltime": None,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kick top-N stats via public API")
    parser.add_argument(
        "--top",
        type=int,
        default=1000,
        help="Number of streamers to keep after sorting by followers (default 1000)",
    )
    parser.add_argument(
        "--pages-per-category",
        type=int,
        default=100,
        help="Max pages per top category (5 streams/page, default 100)",
    )
    parser.add_argument(
        "--global-pages",
        type=int,
        default=250,
        help="Max pages for global English live directory (default 250)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.08,
        help="Seconds between paginated list requests (default 0.08)",
    )
    parser.add_argument(
        "--channel-delay",
        type=float,
        default=0.12,
        help="Seconds between channel detail requests (default 0.12)",
    )
    parser.add_argument(
        "--extra-slugs",
        type=str,
        default="",
        help="Comma/space-separated Kick slugs to always include (e.g. xqc,adinross)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="kick_top1000_stats.json",
        help="Output JSON path",
    )
    args = parser.parse_args()

    session = requests.Session()
    extra = parse_extra_slugs(args.extra_slugs)

    slugs, meta = discover_channels(
        session, args.pages_per_category, args.global_pages, args.delay
    )
    slugs |= extra
    if extra:
        print(f"➕ {len(extra)} extra slug(s) from --extra-slugs")

    print(f"\n📥 Fetching channel details for {len(slugs)} slugs …")
    channels: List[Dict[str, Any]] = []
    for i, slug in enumerate(sorted(slugs), 1):
        data = fetch_channel(session, slug)
        time.sleep(args.channel_delay)
        if not data:
            continue
        channels.append(data)
        if i % 100 == 0:
            print(f"   … {i}/{len(slugs)} slugs requested, {len(channels)} ok")

    channels.sort(
        key=lambda c: c.get("followers_count") or 0, reverse=True
    )
    top = channels[: args.top]

    streamers: List[Dict[str, Any]] = []
    for rank, ch in enumerate(top, start=1):
        slug = ch.get("slug") or ""
        disc = meta.get(slug, {"max_viewers_seen": 0, "sample_title": None})
        streamers.append(build_entry(rank, ch, disc))

    out_obj: Dict[str, Any] = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "period": "past_30_days",
        "source": "kick.com_public_api_live_directory_plus_channel_v2",
        "ranking_method": "followers_count_among_discovered_channels",
        "limitations": (
            "past_30_days viewer and hours metrics are not exposed by Kick’s "
            "unauthenticated public API; discovery misses offline-only channels "
            "unless you pass --extra-slugs."
        ),
        "discovery": {
            "slugs_discovered": len(slugs),
            "channel_profiles_ok": len(channels),
            "output_count": len(streamers),
        },
        "total_streamers": len(streamers),
        "streamers": streamers,
    }

    out_path = Path(args.output)
    out_path.write_text(
        json.dumps(out_obj, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n💾 Wrote {len(streamers)} streamers → {out_path.resolve()}")


if __name__ == "__main__":
    main()
