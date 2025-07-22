import requests
import json
import time
from typing import List, Dict, Any

def get_access_token(client_id: str, client_secret: str) -> str:
    """
    Get an access token from Twitch API using client credentials flow.
    
    Args:
        client_id: Twitch API Client ID
        client_secret: Twitch API Client Secret
        
    Returns:
        Access token string
    """
    token_url = "https://id.twitch.tv/oauth2/token"
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }
    
    try:
        response = requests.post(token_url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data['access_token']
        else:
            print(f"❌ Failed to get access token: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting access token: {e}")
        return None

def fetch_twitchtracker_data(channel_names: List[str]) -> Dict[str, Any]:
    """
    Fetch subscriber-like data from TwitchTracker API.
    This provides follower counts and other metrics that are similar to subscriber data.
    """
    base_url = "https://twitchtracker.com/api/channels/summary/"
    results = {}
    
    for channel_name in channel_names:
        try:
            url = f"{base_url}{channel_name}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                results[channel_name] = data
                print(f"✅ Successfully fetched TwitchTracker data for {channel_name}")
            else:
                print(f"❌ Failed to fetch TwitchTracker data for {channel_name}. Status: {response.status_code}")
                results[channel_name] = {"error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Error fetching TwitchTracker data for {channel_name}: {e}")
            results[channel_name] = {"error": str(e)}
        
        time.sleep(0.5)
    
    return results

def fetch_user_data(channel_names: List[str], client_id: str, access_token: str) -> Dict[str, Any]:
    """
    Fetch basic user data from Twitch Helix API.
    """
    base_url = "https://api.twitch.tv/helix/users"
    results = {}
    
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'VentureCast/1.0',
        'Client-ID': client_id,
        'Authorization': f'Bearer {access_token}'
    }
    
    for channel_name in channel_names:
        try:
            url = f"{base_url}?login={channel_name}"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('data') and len(data['data']) > 0:
                    results[channel_name] = data['data'][0]
                    print(f"✅ Successfully fetched user data for {channel_name}")
                else:
                    print(f"❌ Channel {channel_name} not found")
                    results[channel_name] = {"error": "Channel not found"}
            else:
                print(f"❌ Failed to fetch user data for {channel_name}. Status: {response.status_code}")
                results[channel_name] = {"error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Error fetching user data for {channel_name}: {e}")
            results[channel_name] = {"error": str(e)}
        
        time.sleep(0.5)
    
    return results

def fetch_stream_data(user_ids: List[str], client_id: str, access_token: str) -> Dict[str, Any]:
    """
    Fetch current stream data for users.
    """
    base_url = "https://api.twitch.tv/helix/streams"
    results = {}
    
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'VentureCast/1.0',
        'Client-ID': client_id,
        'Authorization': f'Bearer {access_token}'
    }
    
    # Fetch stream data for all users at once
    user_ids_str = "&user_id=".join(user_ids)
    url = f"{base_url}?user_id={user_ids_str}"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            for stream in data.get('data', []):
                user_id = stream['user_id']
                results[user_id] = stream
            print(f"✅ Successfully fetched stream data for {len(data.get('data', []))} active streams")
        else:
            print(f"❌ Failed to fetch stream data. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching stream data: {e}")
    
    return results

def fetch_twitch_data(channel_names: List[str], client_id: str, client_secret: str) -> Dict[str, Any]:
    """
    Fetch comprehensive data from Twitch Helix API and TwitchTracker API for a list of channel names.
    
    Args:
        channel_names: List of Twitch channel names to fetch data for
        client_id: Twitch API Client ID
        client_secret: Twitch API Client Secret
        
    Returns:
        Dictionary with channel names as keys and their comprehensive data as values
    """
    # Get access token
    access_token = get_access_token(client_id, client_secret)
    if not access_token:
        print("❌ Could not get access token. Exiting.")
        return {}
    
    print("✅ Successfully obtained access token")
    
    # Fetch user data from Twitch API
    user_data = fetch_user_data(channel_names, client_id, access_token)
    
    # Fetch subscriber-like data from TwitchTracker
    tracker_data = fetch_twitchtracker_data(channel_names)
    
    # Extract user IDs for stream data fetching
    user_ids = []
    for channel_name, data in user_data.items():
        if "error" not in data:
            user_ids.append(data['id'])
    
    # Fetch stream data
    stream_data = fetch_stream_data(user_ids, client_id, access_token)
    
    # Combine all data
    comprehensive_results = {}
    for channel_name, user_info in user_data.items():
        if "error" not in user_info:
            user_id = user_info['id']
            tracker_info = tracker_data.get(channel_name, {})
            
            comprehensive_results[channel_name] = {
                **user_info,
                "stream_data": stream_data.get(user_id, None),
                "is_live": user_id in stream_data,
                # TwitchTracker data (subscriber-like metrics)
                "followers_total": tracker_info.get("followers_total", 0),
                "followers": tracker_info.get("followers", 0),  # Monthly follower gain
                "avg_viewers": tracker_info.get("avg_viewers", 0),
                "max_viewers": tracker_info.get("max_viewers", 0),
                "hours_watched": tracker_info.get("hours_watched", 0),
                "minutes_streamed": tracker_info.get("minutes_streamed", 0),
                "rank": tracker_info.get("rank", 0)
            }
        else:
            comprehensive_results[channel_name] = user_info
    
    return comprehensive_results

def save_results_to_file(results: Dict[str, Any], filename: str = "twitch_data.json"):
    """
    Save the results to a JSON file.
    
    Args:
        results: Dictionary containing the fetched data
        filename: Name of the file to save the data to
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"💾 Data saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving data to file: {e}")

def main():
    # Twitch API credentials
    client_id = 'zzsh4vqpt1cv0hp1ia01kd8d5ts3k9'
    client_secret = 'd1g4b82crv41hmkgw0j6yymj1oimvf'
    
    # List of Twitch channel names to fetch data for
    # You can modify this list with the channel names you want to fetch
    channel_names = [
        "pokimane",
        "xqc",
        "shroud",
        "ninja",
        "auronplay",
        "ibai",
        "rubius",
        "tfue",
        "bugha",
        "timthetatman"
    ]
    
    print("🚀 Starting comprehensive Twitch data fetch...")
    print(f"📋 Fetching data for {len(channel_names)} channels...")
    print("🔑 Using provided Client ID and Secret for authentication")
    print("📊 Fetching: User data, Stream status, TwitchTracker metrics")
    print("-" * 50)
    
    # Fetch comprehensive data for all channels
    results = fetch_twitch_data(channel_names, client_id, client_secret)
    
    print("-" * 50)
    print("📊 Fetch Summary:")
    
    # Count successful and failed requests
    successful = sum(1 for data in results.values() if "error" not in data)
    failed = len(results) - successful
    live_streams = sum(1 for data in results.values() if "error" not in data and data.get("is_live", False))
    
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"🔴 Live streams: {live_streams}")
    
    # Save results to file
    save_results_to_file(results)
    
    # Print a sample of the data structure (first successful result)
    for channel_name, data in results.items():
        if "error" not in data:
            print(f"\n📋 Sample data structure for {channel_name}:")
            print(json.dumps(data, indent=2)[:800] + "..." if len(json.dumps(data)) > 800 else json.dumps(data, indent=2))
            break

if __name__ == "__main__":
    main() 