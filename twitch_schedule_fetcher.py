import os
import json
import requests
import argparse
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from twitch_data_fetcher import get_access_token


def fetch_broadcaster_videos(
    broadcaster_id: str,
    client_id: str,
    access_token: str,
    first: int = 100,
    started_at: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch past broadcasts (VODs) for a broadcaster.
    
    Args:
        broadcaster_id: The Twitch broadcaster/channel ID
        client_id: Twitch API client ID
        access_token: OAuth access token
        first: Maximum number of videos to return (default: 100, max: 100)
        started_at: RFC3339 timestamp to filter videos started after this time
    
    Returns:
        List of video objects with duration information
    """
    url = "https://api.twitch.tv/helix/videos"
    headers = {
        "Accept": "application/json",
        "User-Agent": "VentureCast/1.0",
        "Client-ID": client_id,
        "Authorization": f"Bearer {access_token}",
    }
    params = {
        "user_id": broadcaster_id,
        "type": "archive",  # Only get past broadcasts (VODs)
        "first": min(first, 100),  # API limit is 100
    }
    if started_at:
        params["started_at"] = started_at
    
    all_videos = []
    cursor = None
    
    try:
        while True:
            if cursor:
                params["after"] = cursor
            
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                videos = data.get("data", [])
                all_videos.extend(videos)
                
                # Check for pagination
                pagination = data.get("pagination", {})
                cursor = pagination.get("cursor")
                if not cursor or len(videos) == 0:
                    break
            else:
                print(f"⚠️ Failed to fetch videos (HTTP {resp.status_code})")
                break
    except Exception as e:
        print(f"⚠️ Error fetching videos: {e}")
    
    return all_videos


def parse_duration(duration_str: str) -> Optional[int]:
    """
    Parse Twitch duration string (e.g., "2h30m45s") into total seconds.
    
    Args:
        duration_str: Duration string in format like "2h30m45s" or "1h15m" or "45s"
    
    Returns:
        Total duration in seconds, or None if parsing fails
    """
    if not duration_str:
        return None
    
    # Pattern to match hours, minutes, seconds
    pattern = r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?"
    match = re.match(pattern, duration_str)
    
    if not match:
        return None
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    return hours * 3600 + minutes * 60 + seconds


def format_duration(seconds: int) -> str:
    """Format seconds into a human-readable duration string."""
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}m{secs}s" if secs > 0 else f"{minutes}m"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        parts = [f"{hours}h"]
        if minutes > 0:
            parts.append(f"{minutes}m")
        if secs > 0:
            parts.append(f"{secs}s")
        return "".join(parts)


def match_videos_to_schedule_segments(
    segments: List[Dict[str, Any]],
    videos: List[Dict[str, Any]],
    time_window_hours: int = 2,
) -> Dict[str, Dict[str, Any]]:
    """
    Match schedule segments with videos based on start time.
    
    Args:
        segments: List of schedule segments
        videos: List of video objects from the Videos API
        time_window_hours: Maximum time difference in hours to consider a match (default: 2)
    
    Returns:
        Dictionary mapping segment IDs to matched video data
    """
    matches = {}
    now = datetime.now(timezone.utc)
    
    for segment in segments:
        segment_start_str = segment.get("start_time")
        if not segment_start_str:
            continue
        
        try:
            segment_start = datetime.fromisoformat(segment_start_str.replace("Z", "+00:00"))
        except Exception:
            continue
        
        # Only match segments that are in the past
        if segment_start > now:
            continue
        
        # Find the closest video that started near this segment's start time
        best_match = None
        best_diff = None
        
        for video in videos:
            video_created_str = video.get("created_at")
            if not video_created_str:
                continue
            
            try:
                video_created = datetime.fromisoformat(video_created_str.replace("Z", "+00:00"))
                time_diff = abs((video_created - segment_start).total_seconds())
                
                # Only consider videos within the time window
                if time_diff <= time_window_hours * 3600:
                    if best_diff is None or time_diff < best_diff:
                        best_match = video
                        best_diff = time_diff
            except Exception:
                continue
        
        if best_match:
            segment_id = segment.get("id")
            if segment_id:
                matches[segment_id] = best_match
    
    return matches


def fetch_stream_schedule(
    broadcaster_id: str,
    client_id: str,
    access_token: str,
    first: int = 25,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    fetch_all: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Fetch the stream schedule for a given Twitch broadcaster ID.
    
    Args:
        broadcaster_id: The Twitch broadcaster/channel ID
        client_id: Twitch API client ID
        access_token: OAuth access token
        first: Maximum number of schedule segments per request (default: 25, max: 25)
        start_time: RFC3339 timestamp to start returning schedule segments from
        end_time: RFC3339 timestamp to stop returning schedule segments at
        fetch_all: If True, fetch all segments via pagination until end_time is reached
    
    Returns:
        Dictionary with schedule data, including all segments if fetch_all=True
    """
    url = "https://api.twitch.tv/helix/schedule"
    headers = {
        "Accept": "application/json",
        "User-Agent": "VentureCast/1.0",
        "Client-ID": client_id,
        "Authorization": f"Bearer {access_token}",
    }
    
    all_segments = []
    cursor = None
    now = datetime.now(timezone.utc)
    metadata = {}  # Store metadata from first response
    
    # Parse end_time if provided
    end_datetime = None
    if end_time:
        try:
            end_datetime = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except Exception:
            pass
    
    # If no end_time specified but fetch_all is True, use today
    if fetch_all and not end_datetime:
        end_datetime = now
    
    try:
        while True:
            params = {
                "broadcaster_id": broadcaster_id,
                "first": min(first, 25),  # API limit is 25
            }
            if start_time:
                params["start_time"] = start_time
            if cursor:
                params["after"] = cursor
            
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                segments = data.get("data", {}).get("segments", [])
                
                # Store metadata from first response
                if not metadata:
                    metadata = data.get("data", {})
                
                # Filter segments by end_time if specified
                filtered_segments = []
                all_segments_after_end = True  # Track if ALL segments are after end_time
                
                for segment in segments:
                    segment_start_str = segment.get("start_time")
                    if segment_start_str:
                        try:
                            segment_start = datetime.fromisoformat(segment_start_str.replace("Z", "+00:00"))
                            # Check if this segment is before end_time
                            if end_datetime and segment_start > end_datetime:
                                # This segment is after end_time, skip it
                                all_segments_after_end = all_segments_after_end and True
                                continue
                            else:
                                # This segment is before end_time, include it
                                all_segments_after_end = False
                                filtered_segments.append(segment)
                        except Exception:
                            # If we can't parse the date, include it
                            all_segments_after_end = False
                            filtered_segments.append(segment)
                    else:
                        # No start_time, include it
                        all_segments_after_end = False
                        filtered_segments.append(segment)
                
                all_segments.extend(filtered_segments)
                
                # Check for pagination
                pagination = data.get("pagination", {})
                cursor = pagination.get("cursor")
                
                # Stop if:
                # 1. fetch_all is False (single page request)
                # 2. No more pages (no cursor)
                # 3. No segments returned
                # 4. ALL segments on this page are after end_time (we've passed the threshold)
                if not fetch_all or not cursor or len(segments) == 0:
                    break
                
                # If all segments on this page are after end_time, we've reached the end
                if end_datetime and all_segments_after_end and len(segments) > 0:
                    break
            else:
                print(f"❌ Failed to fetch schedule (HTTP {resp.status_code})")
                try:
                    print(f"Response: {resp.json()}")
                except Exception:
                    print(f"Raw response text: {resp.text[:500]}")
                # Return what we have so far if any
                if all_segments:
                    return {
                        "data": {
                            "segments": all_segments,
                            "broadcaster_id": metadata.get("broadcaster_id"),
                            "broadcaster_name": metadata.get("broadcaster_name"),
                            "vacation": metadata.get("vacation"),
                        },
                        "pagination": {},
                    }
                return None
        
        # Return combined results
        if all_segments:
            return {
                "data": {
                    "segments": all_segments,
                    "broadcaster_id": metadata.get("broadcaster_id"),
                    "broadcaster_name": metadata.get("broadcaster_name"),
                    "vacation": metadata.get("vacation"),
                },
                "pagination": {},
            }
        else:
            # Fallback to single request if no pagination was needed
            params = {
                "broadcaster_id": broadcaster_id,
                "first": min(first, 25),
            }
            if start_time:
                params["start_time"] = start_time
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code == 200:
                return resp.json()
            return None
            
    except Exception as e:
        print(f"❌ Error fetching schedule: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Fetch Twitch stream schedule for a broadcaster"
    )
    parser.add_argument(
        "--start-time",
        type=str,
        help='Start time for schedule results. Use "one_month_ago", "two_months_ago", or "three_months_ago" to start from that time, or provide an RFC3339 timestamp (e.g., "2025-11-16T00:00:00Z")',
    )
    parser.add_argument(
        "--fetch-durations",
        action="store_true",
        help="Fetch actual stream durations from past broadcasts (VODs) and match them to schedule segments",
    )
    args = parser.parse_args()

    # Mirror credentials style from twitch_data_fetcher.py
    client_id = "zzsh4vqpt1cv0hp1ia01kd8d5ts3k9"
    client_secret = "d1g4b82crv41hmkgw0j6yymj1oimvf"

    # Allow overriding via environment variables if desired
    client_id = os.getenv("TWITCH_CLIENT_ID", client_id)
    client_secret = os.getenv("TWITCH_CLIENT_SECRET", client_secret)

    # Get broadcaster/channel ID from environment or input
    broadcaster_id = os.getenv("TWITCH_BROADCASTER_ID")
    if not broadcaster_id:
        # Fallback: simple prompt if not provided
        broadcaster_id = input("Enter Twitch broadcaster/channel ID: ").strip()

    # Handle start_time flag (command-line arg takes precedence over env var)
    start_time = None
    start_time_input = args.start_time or os.getenv("TWITCH_SCHEDULE_START_TIME")
    if start_time_input:
        if start_time_input.lower() == "one_month_ago":
            # Calculate one month ago (approximately 30 days)
            one_month_ago = datetime.now(timezone.utc) - timedelta(days=30)
            start_time = one_month_ago.strftime("%Y-%m-%dT%H:%M:%SZ")
            print(f"📅 Using start_time: {start_time} (one month ago)")
        elif start_time_input.lower() == "two_months_ago":
            # Calculate two months ago (approximately 60 days)
            two_months_ago = datetime.now(timezone.utc) - timedelta(days=60)
            start_time = two_months_ago.strftime("%Y-%m-%dT%H:%M:%SZ")
            print(f"📅 Using start_time: {start_time} (two months ago)")
        elif start_time_input.lower() == "three_months_ago":
            # Calculate three months ago (approximately 90 days)
            three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
            start_time = three_months_ago.strftime("%Y-%m-%dT%H:%M:%SZ")
            print(f"📅 Using start_time: {start_time} (three months ago)")
        else:
            # Use the provided timestamp as-is
            start_time = start_time_input
            print(f"📅 Using start_time: {start_time}")

    print(f"🚀 Fetching Twitch schedule for broadcaster_id={broadcaster_id} ...")

    access_token = get_access_token(client_id, client_secret)
    if not access_token:
        print("❌ Could not get access token. Exiting.")
        return

    # Set end_time to today to get all segments from start_time until today
    end_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Fetch all segments via pagination from start_time until today
    data = fetch_stream_schedule(
        broadcaster_id, 
        client_id, 
        access_token, 
        start_time=start_time,
        end_time=end_time,
        fetch_all=True
    )
    if not data:
        print("❌ No schedule data returned.")
        return

    segments = data.get("data", {}).get("segments") or []
    if not segments:
        print("ℹ️ No schedule segments found.")
        return

    # Optionally fetch video durations for past segments
    video_matches = {}
    if args.fetch_durations:
        print("📹 Fetching past broadcasts to get actual stream durations...")
        videos = fetch_broadcaster_videos(broadcaster_id, client_id, access_token, first=100)
        print(f"   Found {len(videos)} past broadcasts")
        
        if videos:
            video_matches = match_videos_to_schedule_segments(segments, videos)
            print(f"   Matched {len(video_matches)} schedule segments with videos")
            
            # Enrich segments with video duration data
            for segment in segments:
                segment_id = segment.get("id")
                if segment_id in video_matches:
                    video = video_matches[segment_id]
                    duration_str = video.get("duration", "")
                    duration_seconds = parse_duration(duration_str)
                    
                    # Add duration info to segment
                    segment["actual_duration"] = {
                        "duration_string": duration_str,
                        "duration_seconds": duration_seconds,
                        "duration_formatted": format_duration(duration_seconds) if duration_seconds else None,
                        "video_id": video.get("id"),
                        "video_title": video.get("title"),
                        "video_created_at": video.get("created_at"),
                        "video_url": video.get("url"),
                    }

    # Save to a JSON file and also print a concise summary
    out_filename = f"twitch_schedule_{broadcaster_id}.json"
    with open(out_filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 Full schedule JSON saved to {out_filename}")

    print("\n📅 Schedule segments:")
    now = datetime.now(timezone.utc)
    for seg in segments:
        title = seg.get("title") or "(no title)"
        category = (seg.get("category") or {}).get("name") or "(no category)"
        start_time_str = seg.get("start_time")
        end_time = seg.get("end_time")
        canceled = seg.get("canceled_until")
        
        # Determine if this is a past segment
        is_past = False
        if start_time_str:
            try:
                start_dt = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
                is_past = start_dt < now
            except Exception:
                pass

        print(f"- {title}")
        print(f"  Category: {category}")
        print(f"  Starts : {start_time_str}")
        print(f"  Ends   : {end_time}")
        
        # Show actual duration if available
        actual_duration = seg.get("actual_duration")
        if actual_duration:
            duration_fmt = actual_duration.get("duration_formatted")
            if duration_fmt:
                print(f"  ⏱️  Actual Duration: {duration_fmt}")
                video_url = actual_duration.get("video_url")
                if video_url:
                    print(f"  📺 Video: {video_url}")
        
        if canceled:
            print(f"  ❗ Canceled until: {canceled}")
        print()


if __name__ == "__main__":
    main()


