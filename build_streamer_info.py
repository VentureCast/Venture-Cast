import os
import csv
import uuid
from typing import Dict, Any, List, Optional

from supabase import create_client, Client

SUPABASE_URL = "https://jloahddizurxqzltkksk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI"


def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_streamers(supabase: Client) -> Dict[str, Dict[str, Any]]:
    """Return map streamer_id -> {name, platform, channel_id}."""
    data: Dict[str, Dict[str, Any]] = {}
    try:
        res = supabase.table('Streamers').select('streamer_id, username, platform, channel_id').execute()
        for row in res.data or []:
            sid = row.get('streamer_id')
            if not sid:
                continue
            data[sid] = {
                'name': row.get('username') or '',
                'platform': row.get('platform') or '',
                'channel_id': row.get('channel_id') if row.get('channel_id') is not None else ''
            }
    except Exception as e:
        print(f"❌ Error fetching Streamers: {e}")
    return data


def fetch_followers_from_price(supabase: Client) -> Dict[str, Optional[int]]:
    """Return map streamer_id -> followers from StreamerPrice (if exists)."""
    followers: Dict[str, Optional[int]] = {}
    try:
        res = supabase.table('StreamerPrice').select('streamer_id, followers').execute()
        for row in res.data or []:
            sid = row.get('streamer_id')
            followers[sid] = row.get('followers')
    except Exception as e:
        print(f"⚠️ Could not read StreamerPrice (followers). {e}")
    return followers


def fetch_followers_from_stats(supabase: Client) -> Dict[str, Optional[int]]:
    """Fallback: map streamer_id -> followers from StreamerStats."""
    followers: Dict[str, Optional[int]] = {}
    try:
        res = supabase.table('StreamerStats').select('streamer_id, followers').execute()
        for row in res.data or []:
            sid = row.get('streamer_id')
            followers[sid] = row.get('followers')
    except Exception as e:
        print(f"⚠️ Could not read StreamerStats (followers). {e}")
    return followers


def collect_unique_streamer_ids(streamers_map: Dict[str, Dict[str, Any]], price_followers: Dict[str, Any], stats_followers: Dict[str, Any]) -> List[str]:
    ids = set(streamers_map.keys()) | set(price_followers.keys()) | set(stats_followers.keys())
    return list(ids)


def build_records(supabase: Client) -> List[Dict[str, Any]]:
    streamers_map = fetch_streamers(supabase)
    price_followers = fetch_followers_from_price(supabase)
    stats_followers = fetch_followers_from_stats(supabase)

    all_ids = collect_unique_streamer_ids(streamers_map, price_followers, stats_followers)

    records: List[Dict[str, Any]] = []
    for sid in all_ids:
        info_id = str(uuid.uuid4())
        base = streamers_map.get(sid, {})
        # Prefer StreamerPrice followers; fallback to StreamerStats; last resort blank
        followers_val = price_followers.get(sid)
        if followers_val is None:
            followers_val = stats_followers.get(sid)
        # Normalize types and blanks
        followers_final = followers_val if isinstance(followers_val, int) else (followers_val if isinstance(followers_val, (int,)) else None)
        name_final = base.get('name') or ''
        platform_final = base.get('platform') or ''
        channel_id_val = base.get('channel_id')
        # Ensure int or blank
        if channel_id_val is None or channel_id_val == '':
            channel_id_final: Any = None
        else:
            channel_id_final = channel_id_val

        record = {
            'info_id': info_id,
            'streamer_id': sid,
            'followers': followers_final,  # int or None
            'name': name_final,            # str (may be '')
            'platform': platform_final,    # str (may be '')
            'channel_id': channel_id_final # int or None
        }
        records.append(record)
    return records


def upload_records(supabase: Client, records: List[Dict[str, Any]]) -> bool:
    try:
        if not records:
            print("No records to upload.")
            return True
        # Insert in batches
        batch_size = 200
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            res = supabase.table('StreamerInfo').insert(batch).execute()
            if not getattr(res, 'data', None):
                print(f"❌ Upload failed for batch starting {i}")
                return False
        print("✅ Upload completed to StreamerInfo")
        return True
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False


def write_csv(records: List[Dict[str, Any]], path: str = 'streamer_info.csv') -> None:
    fields = ['info_id', 'streamer_id', 'followers', 'name', 'platform', 'channel_id']
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in records:
            # Replace None with blank for CSV
            row = {k: ('' if r[k] is None else r[k]) for k in fields}
            w.writerow(row)
    print(f"💾 Wrote CSV: {path} ({len(records)} rows)")


def main():
    supabase = get_client()
    records = build_records(supabase)
    print(f"Built {len(records)} StreamerInfo records")

    # Try upload; if fails, write CSV
    if not upload_records(supabase, records):
        write_csv(records, 'streamer_info.csv')


if __name__ == '__main__':
    main()
