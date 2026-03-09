"""
Experimental script to pull viewer-count statistics from TwitchTracker.

Data sources
------------
1. Public JSON API  : /api/channels/summary/<name>  →  30-day summary
2. Page scraping    : channel page → ecs decode → fragments POST → ecs decode
                      →  lifetime totals, weekly / monthly / 3-month stats,
                         and full monthly history back to channel creation

Output
------
A JSON file with two top-level sections per streamer:
  • past_30_days   – viewer / watch stats for the last 30 days
  • all_time       – lifetime totals scraped from the channel page
"""

import base64
import json
import re
import time
import requests
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


CHANNEL_NAMES = [
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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


# ---------------------------------------------------------------------------
#  TwitchTracker simple JSON API  (30-day summary)
# ---------------------------------------------------------------------------

def fetch_tt_summary(channel_name: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the 30-day channel summary from the public TwitchTracker API.

    Returns dict with keys:
        rank, minutes_streamed, avg_viewers, max_viewers,
        hours_watched, followers, followers_total
    """
    url = f"https://twitchtracker.com/api/channels/summary/{channel_name.lower()}"
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        print(f"⚠️  TT API returned HTTP {resp.status_code} for {channel_name}")
    except Exception as e:
        print(f"⚠️  TT API error for {channel_name}: {e}")
    return None


# ---------------------------------------------------------------------------
#  TwitchTracker page scraping  (lifetime + period stats)
# ---------------------------------------------------------------------------

def _decode_ecs(raw: str) -> Dict[str, Any]:
    """
    Decode the obfuscated <meta id="ecs"> content embedded in TwitchTracker
    pages.  The encoding replaces 'W' with '#' in the base64 and joins
    multiple payloads with '!'.  The last payload is a JSON list of key names
    that map to the preceding payloads.
    """
    deobfuscated = raw.replace("#", "W")
    parts = deobfuscated.split("!")

    decoded_parts = []
    for part in parts:
        padding = 4 - len(part) % 4
        if padding != 4:
            part += "=" * padding
        decoded_parts.append(json.loads(base64.b64decode(part).decode("utf-8")))

    keys = decoded_parts[-1]
    result: Dict[str, Any] = {}
    for i, key in enumerate(keys):
        if i < len(decoded_parts) - 1:
            result[key] = decoded_parts[i]
    return result


def _extract_ecs(html: str) -> Optional[Dict[str, Any]]:
    """Find and decode the ecs meta tag in an HTML string."""
    match = re.search(r'id="ecs"\s+content="([^"]+)"', html)
    if not match:
        return None
    return _decode_ecs(match.group(1))


def _parse_lifetime_overview(html: str) -> Dict[str, Any]:
    """
    Parse the lifetime-overview-wrapper section of the fragments HTML
    for all-time totals.
    """
    result: Dict[str, Any] = {}
    section_start = html.find("lifetime-overview-wrapper")
    if section_start < 0:
        return result

    section_end = html.find('id="complect-wrapper"', section_start)
    if section_end < 0:
        section_end = section_start + 5000
    section = html[section_start:section_end]

    numbers = list(
        re.finditer(r'class="to-number(?:-lg)?"[^>]*>([^<]+)<', section)
    )
    labels = list(
        re.finditer(r'<div class="g-x-s-label\b[^"]*">([^<]+)</div>', section)
    )

    for num_match in numbers:
        val_str = num_match.group(1).strip().replace(",", "")
        best_label = None
        best_dist = float("inf")
        for lab_match in labels:
            dist = lab_match.start() - num_match.end()
            if 0 < dist < best_dist:
                best_dist = dist
                best_label = lab_match.group(1).strip()
        if not best_label:
            continue
        try:
            numeric = float(val_str)
            if numeric == int(numeric):
                numeric = int(numeric)
        except ValueError:
            numeric = val_str
        result[best_label] = numeric
    return result


def _parse_recent_streams(html: str) -> List[Dict[str, Any]]:
    """
    Extract per-stream rows from the fragments HTML.
    Each row contains: date, avg_viewers, follower_gain, duration_minutes.
    """
    pattern = re.compile(
        r'<a class="entity entity-line"[^>]*>'
        r".*?data-dt=\"([^\"]+)\""
        r'.*?<div class="to-number-lg">(\d+)</div>'
        r'.*?<div class="to-number-lg">(\d+)</div>'
        r'.*?<div class="to-time-lg">(\d+)</div>',
        re.DOTALL,
    )
    streams = []
    for m in pattern.finditer(html):
        streams.append(
            {
                "date": m.group(1),
                "avg_viewers": int(m.group(2)),
                "followers_gained": int(m.group(3)),
                "duration_minutes": int(m.group(4)),
            }
        )
    return streams


def fetch_tt_page_data(channel_name: str) -> Optional[Dict[str, Any]]:
    """
    Scrape the TwitchTracker channel page to obtain:
      - lifetime overview stats
      - period performance (week / month / 3 months) with curr + prev
      - per-stream recent data
      - monthly historical chart data
    """
    page_url = f"https://twitchtracker.com/{channel_name.lower()}"
    headers = {**_BROWSER_HEADERS, "Referer": page_url}

    resp = None
    for attempt in range(3):
        try:
            resp = requests.get(page_url, headers=headers, timeout=30)
            if resp.status_code == 200:
                break
            if resp.status_code == 429:
                wait = 8 * (attempt + 1)
                print(f"    ⏳ Page rate-limited, waiting {wait}s …")
                time.sleep(wait)
                continue
            print(f"⚠️  Channel page returned HTTP {resp.status_code} for {channel_name}")
            return None
        except Exception as e:
            print(f"⚠️  Error fetching channel page for {channel_name}: {e}")
            return None
    if not resp or resp.status_code != 200:
        print(f"⚠️  Could not fetch channel page for {channel_name} after retries")
        return None

    page_ecs = _extract_ecs(resp.text)
    if not page_ecs or "fragments" not in page_ecs:
        print(f"⚠️  Could not decode page ecs for {channel_name}")
        return None

    fragments_url = page_ecs["fragments"]

    channel_match = re.search(
        r"window\.channel\s*=\s*\{[^}]*id:\s*(\d+)", resp.text
    )
    channel_id = int(channel_match.group(1)) if channel_match else 0

    frag_resp = None
    for attempt in range(3):
        try:
            frag_resp = requests.post(
                fragments_url,
                headers={**headers, "X-Requested-With": "XMLHttpRequest"},
                data={"id": channel_id},
                timeout=30,
            )
            if frag_resp.status_code == 200:
                break
            if frag_resp.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"    ⏳ Rate-limited, waiting {wait}s …")
                time.sleep(wait)
                continue
            print(f"⚠️  Fragments returned HTTP {frag_resp.status_code} for {channel_name}")
            return None
        except Exception as e:
            print(f"⚠️  Error fetching fragments for {channel_name}: {e}")
            return None
    if not frag_resp or frag_resp.status_code != 200:
        print(f"⚠️  Could not fetch fragments for {channel_name} after retries")
        return None

    frag_html = frag_resp.text

    lifetime = _parse_lifetime_overview(frag_html)
    recent_streams = _parse_recent_streams(frag_html)

    frag_ecs = _extract_ecs(frag_html)
    performance = {}
    monthly_history = []
    if frag_ecs:
        performance = frag_ecs.get("performance", {})
        charts_data = frag_ecs.get("charts", {})
        if isinstance(charts_data, dict):
            raw_stats = charts_data.get("statistics", [])
            for entry in raw_stats:
                monthly_history.append(
                    {
                        "month": entry[0],
                        "avg_viewers": entry[1],
                        "max_viewers": entry[2],
                        "minutes_streamed": entry[3],
                        "followers_gained": entry[4],
                    }
                )

    return {
        "lifetime": lifetime,
        "performance": performance,
        "recent_streams": recent_streams,
        "monthly_history": monthly_history,
    }


# ---------------------------------------------------------------------------
#  Combine everything
# ---------------------------------------------------------------------------

def _period_summary(perf: Dict[str, Any], period_key: str) -> Optional[Dict[str, Any]]:
    """Extract a cleaned summary for a given period from the performance dict."""
    period = perf.get(period_key)
    if not period:
        return None
    curr = period.get("curr", {})
    return {
        "avg_viewers": curr.get("avg_viewers"),
        "max_viewers": curr.get("max_viewers"),
        "duration_minutes": curr.get("duration"),
        "hours_watched": curr.get("man_hours"),
        "followers_gained": curr.get("followers"),
        "streams_count": curr.get("streams_number"),
        "active_days": curr.get("active_days"),
    }


def _all_time_from_history(
    monthly: List[Dict[str, Any]], lifetime: Dict[str, Any]
) -> Dict[str, Any]:
    """Compute all-time aggregates from monthly history + lifetime overview."""
    total_minutes = sum(m.get("minutes_streamed", 0) for m in monthly)
    total_followers = sum(m.get("followers_gained", 0) for m in monthly)
    all_peak = max((m.get("max_viewers", 0) for m in monthly), default=0)

    viewer_months = [m for m in monthly if m.get("avg_viewers", 0) > 0]
    weighted_avg = 0
    if viewer_months:
        total_viewer_minutes = sum(
            m["avg_viewers"] * m.get("minutes_streamed", 1) for m in viewer_months
        )
        weighted_avg = round(total_viewer_minutes / max(total_minutes, 1))

    return {
        "total_hours_streamed": lifetime.get("Total hours streamed"),
        "all_time_peak_viewers": lifetime.get(
            "Highest number of viewers", all_peak
        ),
        "total_followers": lifetime.get("Total followers"),
        "total_games_streamed": lifetime.get("Total games streamed"),
        "avg_viewers_weighted": weighted_avg,
        "months_tracked": len(monthly),
    }


def build_viewer_stats(channel_names: List[str]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    for name in channel_names:
        print(f"\n📡 {name} …")
        entry: Dict[str, Any] = {"channel_name": name, "platform": "Twitch"}

        # --- 30-day summary (simple API) ---
        summary = fetch_tt_summary(name)
        if summary:
            entry["past_30_days"] = {
                "rank": summary.get("rank"),
                "avg_viewers": summary.get("avg_viewers"),
                "peak_viewers": summary.get("max_viewers"),
                "hours_watched": summary.get("hours_watched"),
                "minutes_streamed": summary.get("minutes_streamed"),
                "followers_gained": summary.get("followers"),
                "followers_total": summary.get("followers_total"),
            }
            print(
                f"    API  → avg {summary.get('avg_viewers')}, "
                f"peak {summary.get('max_viewers')}, "
                f"rank #{summary.get('rank')}"
            )
        else:
            entry["past_30_days"] = None
        time.sleep(1)

        # --- Page scraping for all-time + period stats ---
        page_data = fetch_tt_page_data(name)
        if page_data:
            lifetime = page_data["lifetime"]
            performance = page_data["performance"]
            monthly = page_data["monthly_history"]
            recent = page_data["recent_streams"]

            entry["all_time"] = _all_time_from_history(monthly, lifetime)

            week_summary = _period_summary(performance, "week")
            if week_summary:
                entry["past_7_days"] = week_summary

            three_mo = _period_summary(performance, "3 months")
            if three_mo:
                entry["past_3_months"] = three_mo

            entry["recent_streams"] = recent[:10]

            print(
                f"    Page → lifetime peak {lifetime.get('Highest number of viewers')}, "
                f"{len(monthly)} months of history, "
                f"{len(recent)} recent streams"
            )
        else:
            entry["all_time"] = None
        time.sleep(3)

        results.append(entry)

    return results


def main():
    print("🚀 TwitchTracker Viewer Stats (Experimental)")
    print(f"   Channels: {', '.join(CHANNEL_NAMES)}\n")

    stats = build_viewer_stats(CHANNEL_NAMES)

    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "data_sources": {
            "past_30_days": "TwitchTracker public API (/api/channels/summary)",
            "all_time": "TwitchTracker channel page scraping (lifetime overview + monthly history)",
            "past_7_days": "TwitchTracker channel page scraping (period performance)",
            "past_3_months": "TwitchTracker channel page scraping (period performance)",
            "recent_streams": "TwitchTracker channel page scraping (per-stream rows)",
        },
        "streamers": stats,
    }

    out_file = "twitchtracker_viewer_stats.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Results saved to {out_file}")


if __name__ == "__main__":
    main()
