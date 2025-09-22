import json
import time
import os
import csv
from typing import List, Dict, Any
from kickapi import KickAPI

def download_image(url: str, path: str) -> bool:
    """Download an image from URL and save it locally"""
    import requests
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
        else:
            print(f"❌ Failed to download image from {url} (HTTP {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Error downloading image from {url}: {e}")
        return False

def fetch_kick_channel_data(channel_username: str) -> Dict[str, Any]:
    """Fetch comprehensive data for a Kick channel"""
    try:
        # Create an instance of KickAPI
        kick_api = KickAPI()
        
        print(f"🔍 Fetching data for Kick channel: {channel_username}")
        
        # Fetch channel data by username
        channel = kick_api.channel(channel_username)
        
        print(f"🔍 API Response: {type(channel)} - {channel}")
        
        if not channel:
            return {"error": f"Channel '{channel_username}' not found or could not be accessed"}
        
        # Check if channel has the expected attributes
        print(f"🔍 Channel attributes: {dir(channel) if hasattr(channel, '__dict__') else 'No attributes'}")
        if hasattr(channel, 'username'):
            print(f"🔍 Channel username: {channel.username}")
        else:
            print("🔍 No username attribute found")
        
        # Extract channel information
        channel_data = {
            "channel_id": channel.id,
            "username": channel.username,
            "bio": channel.bio,
            "avatar_url": channel.avatar,
            "followers": channel.followers,
            "playback_url": channel.playback,
            "is_live": getattr(channel, 'is_live', False),
            "viewer_count": getattr(channel, 'viewer_count', 0),
            "category": getattr(channel, 'category', {}),
            "language": getattr(channel, 'language', 'Unknown'),
            "created_at": getattr(channel, 'created_at', 'Unknown'),
            "verified": getattr(channel, 'verified', False),
            "banner_image": getattr(channel, 'banner_image', ''),
            "livestream": getattr(channel, 'livestream', {}),
        }
        
        # Try to fetch videos if available
        try:
            videos_data = []
            if hasattr(channel, 'videos') and channel.videos:
                print(f"📹 Found {len(channel.videos)} videos")
                for video in channel.videos[:5]:  # Limit to first 5 videos
                    video_info = {
                        "video_id": video.id,
                        "title": video.title,
                        "thumbnail": video.thumbnail,
                        "duration": video.duration,
                        "views": video.views,
                        "created_at": video.created_at,
                        "language": video.language,
                        "stream_url": video.stream
                    }
                    videos_data.append(video_info)
            channel_data["videos"] = videos_data
        except Exception as e:
            print(f"⚠️ Could not fetch videos: {e}")
            channel_data["videos"] = []
        
        # Try to fetch clips if available
        try:
            clips_data = []
            if hasattr(channel, 'clips') and channel.clips:
                print(f"🎬 Found {len(channel.clips)} clips")
                for clip in channel.clips[:5]:  # Limit to first 5 clips
                    clip_info = {
                        "clip_id": clip.id,
                        "title": clip.title,
                        "thumbnail": clip.thumbnail,
                        "duration": clip.duration,
                        "created_at": clip.created_at,
                        "stream_url": clip.stream,
                        "creator": getattr(clip, 'creator', {}),
                        "category": getattr(clip, 'category', {})
                    }
                    clips_data.append(clip_info)
            channel_data["clips"] = clips_data
        except Exception as e:
            print(f"⚠️ Could not fetch clips: {e}")
            channel_data["clips"] = []
        
        # Try to fetch leaderboard data if available
        try:
            leaderboard_data = {}
            if hasattr(channel, 'leaderboards') and channel.leaderboards:
                leaderboard = channel.leaderboards
                leaderboard_data = {
                    "gifts_all_time": [{"username": user.username, "quantity": user.quantity} for user in leaderboard.gifts[:10]],
                    "gifts_week": [{"username": user.username, "quantity": user.quantity} for user in leaderboard.gifts_week[:10]],
                    "gifts_month": [{"username": user.username, "quantity": user.quantity} for user in leaderboard.gifts_month[:10]]
                }
            channel_data["leaderboard"] = leaderboard_data
        except Exception as e:
            print(f"⚠️ Could not fetch leaderboard: {e}")
            channel_data["leaderboard"] = {}
        
        return channel_data
        
    except Exception as e:
        print(f"❌ Error fetching channel data for {channel_username}: {e}")
        return {"error": str(e)}

def download_profile_image(channel_data: Dict[str, Any], image_dir: str) -> str:
    """Download and save the channel's profile image"""
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
    
    avatar_url = channel_data.get('avatar_url', '')
    username = channel_data.get('username', 'unknown')
    
    if avatar_url:
        # Determine file extension
        ext = os.path.splitext(avatar_url)[1].split('?')[0] or '.jpg'
        if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
            ext = '.jpg'
        
        local_path = os.path.join(image_dir, f"{username}{ext}")
        
        if download_image(avatar_url, local_path):
            print(f"✅ Downloaded avatar: {avatar_url} -> {local_path}")
            return local_path
        else:
            print(f"❌ Failed to download avatar for {username}")
            return ""
    else:
        print(f"⚠️ No avatar URL found for {username}")
        return ""

def save_results_to_file(results: Dict[str, Any], filename: str = "kick_data.json"):
    """Save the fetched data to a JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"💾 Data saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving data to file: {e}")

def display_channel_info(channel_data: Dict[str, Any]):
    """Display channel information in a formatted way"""
    if not channel_data or "error" in channel_data:
        print("\n" + "="*60)
        print("❌ ERROR: No channel data available")
        print("="*60)
        if channel_data and "error" in channel_data:
            print(f"Error: {channel_data['error']}")
        return
    
    print("\n" + "="*60)
    username = channel_data.get('username', 'Unknown')
    print(f"🎯 KICK CHANNEL DATA: {username.upper() if username else 'UNKNOWN'}")
    print("="*60)
    
    # Basic channel info
    print(f"📺 Channel ID: {channel_data.get('channel_id', 'N/A')}")
    print(f"👤 Username: {channel_data.get('username', 'N/A')}")
    print(f"📝 Bio: {channel_data.get('bio', 'N/A')}")
    
    followers = channel_data.get('followers', 0)
    if followers is not None:
        print(f"👥 Followers: {followers:,}")
    else:
        print(f"👥 Followers: N/A")
    
    print(f"🔴 Is Live: {channel_data.get('is_live', False)}")
    
    viewer_count = channel_data.get('viewer_count', 0)
    if viewer_count is not None:
        print(f"👀 Current Viewers: {viewer_count:,}")
    else:
        print(f"👀 Current Viewers: N/A")
    
    print(f"🌍 Language: {channel_data.get('language', 'N/A')}")
    print(f"✅ Verified: {channel_data.get('verified', False)}")
    print(f"📅 Created: {channel_data.get('created_at', 'N/A')}")
    print(f"🖼 Avatar URL: {channel_data.get('avatar_url', 'N/A')}")
    print(f"📺 Playback URL: {channel_data.get('playback_url', 'N/A')}")
    
    # Category info
    category = channel_data.get('category', {})
    if category:
        print(f"🏷 Category: {category.get('name', 'N/A')} (ID: {category.get('id', 'N/A')})")
    
    # Livestream info
    livestream = channel_data.get('livestream', {})
    if livestream:
        print(f"🔴 Livestream: {livestream.get('title', 'N/A')}")
        print(f"📊 Livestream Viewers: {livestream.get('viewer_count', 0):,}")
    
    # Videos info
    videos = channel_data.get('videos', [])
    if videos:
        print(f"\n📹 RECENT VIDEOS ({len(videos)} shown):")
        for i, video in enumerate(videos, 1):
            print(f"  {i}. {video.get('title', 'N/A')}")
            views = video.get('views', 0)
            if views is not None:
                print(f"     👀 Views: {views:,} | ⏱ Duration: {video.get('duration', 'N/A')}")
            else:
                print(f"     👀 Views: N/A | ⏱ Duration: {video.get('duration', 'N/A')}")
            print(f"     📅 Created: {video.get('created_at', 'N/A')}")
    
    # Clips info
    clips = channel_data.get('clips', [])
    if clips:
        print(f"\n🎬 RECENT CLIPS ({len(clips)} shown):")
        for i, clip in enumerate(clips, 1):
            print(f"  {i}. {clip.get('title', 'N/A')}")
            print(f"     ⏱ Duration: {clip.get('duration', 'N/A')}")
            print(f"     📅 Created: {clip.get('created_at', 'N/A')}")
    
    # Leaderboard info
    leaderboard = channel_data.get('leaderboard', {})
    if leaderboard:
        print(f"\n🏆 LEADERBOARD DATA:")
        
        gifts_all_time = leaderboard.get('gifts_all_time', [])
        if gifts_all_time:
            print(f"  🎁 Top Gifters (All Time):")
            for i, gifter in enumerate(gifts_all_time[:5], 1):
                quantity = gifter.get('quantity', 0)
                if quantity is not None:
                    print(f"    {i}. {gifter.get('username', 'N/A')} - {quantity:,} gifts")
                else:
                    print(f"    {i}. {gifter.get('username', 'N/A')} - N/A gifts")
        
        gifts_week = leaderboard.get('gifts_week', [])
        if gifts_week:
            print(f"  📅 Top Gifters (This Week):")
            for i, gifter in enumerate(gifts_week[:5], 1):
                quantity = gifter.get('quantity', 0)
                if quantity is not None:
                    print(f"    {i}. {gifter.get('username', 'N/A')} - {quantity:,} gifts")
                else:
                    print(f"    {i}. {gifter.get('username', 'N/A')} - N/A gifts")
    
    print("="*60)

def read_usernames_from_csv(csv_file: str) -> List[str]:
    """Read usernames from CSV file"""
    usernames = []
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row and row[0].strip():  # Skip empty rows
                    usernames.append(row[0].strip())
        print(f"📋 Read {len(usernames)} usernames from {csv_file}")
        return usernames
    except Exception as e:
        print(f"❌ Error reading CSV file {csv_file}: {e}")
        return []

def save_to_csv(data: List[Dict[str, Any]], output_file: str):
    """Save data to CSV with specified columns"""
    fieldnames = [
        'platform', 'username', 'channel_id', 'category', 
        'created_at', 'ticker_name', 'total_shares', 'profile_picture_path'
    ]
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"💾 Data saved to {output_file}")
    except Exception as e:
        print(f"❌ Error saving CSV file: {e}")

def process_kick_batch(input_csv: str, output_csv: str):
    """Process Kick usernames from CSV and output formatted data"""
    print("🚀 Processing Kick batch data...")
    print(f"📡 Using KickApi package from: https://github.com/Enmn/KickApi")
    
    # Read usernames from input CSV
    usernames = read_usernames_from_csv(input_csv)
    if not usernames:
        print("❌ No usernames found in input CSV")
        return
    
    # Process each username
    results = []
    for i, username in enumerate(usernames, 1):
        print(f"\n📺 Processing {i}/{len(usernames)}: {username}")
        
        # Fetch channel data
        channel_data = fetch_kick_channel_data(username)
        
        if "error" in channel_data:
            print(f"❌ Failed to fetch data for {username}: {channel_data['error']}")
            # Still add a row with available data
            result = {
                'platform': 'Kick',
                'username': username,
                'channel_id': 'NULL',
                'category': 'Streaming',
                'created_at': 'NULL',
                'ticker_name': 'NULL',
                'total_shares': 1000000,
                'profile_picture_path': 'NULL'
            }
        else:
            # Extract channel ID
            channel_id = channel_data.get('channel_id', 'NULL')
            if channel_id is None:
                channel_id = 'NULL'
            
            result = {
                'platform': 'Kick',
                'username': channel_data.get('username', username),
                'channel_id': channel_id,
                'category': 'Streaming',
                'created_at': 'NULL',
                'ticker_name': 'NULL',
                'total_shares': 1000000,
                'profile_picture_path': 'NULL'
            }
        
        results.append(result)
        print(f"✅ Processed {username}")
        
        # Add small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Save results to CSV
    save_to_csv(results, output_csv)
    print(f"\n✅ Batch processing completed! Processed {len(results)} streamers")
    print(f"📄 Results saved to: {output_csv}")

def main():
    """Main function to fetch Kick channel data"""
    # Process the batch CSV file
    input_file = "kickbatch1.csv"
    output_file = "kick_batch_output.csv"
    
    if os.path.exists(input_file):
        process_kick_batch(input_file, output_file)
    else:
        print(f"❌ Input file {input_file} not found")
        print("Falling back to single channel test...")
        
        # Fallback to original single channel test
        test_channels = ["JXB", "xqc", "trainwreckstv", "adinross"]
        channel_username = test_channels[1]  # Try xqc instead
        image_dir = "profile_images"
        
        print("🚀 Fetching Kick channel data...")
        print(f"📡 Using KickApi package from: https://github.com/Enmn/KickApi")
        
        # Fetch channel data
        channel_data = fetch_kick_channel_data(channel_username)
        
        if "error" in channel_data:
            print(f"❌ Failed to fetch data: {channel_data['error']}")
            return
        
        # Display the information
        display_channel_info(channel_data)
        
        # Download profile image
        print(f"\n🖼 Downloading profile image...")
        image_path = download_profile_image(channel_data, image_dir)
        if image_path:
            channel_data["local_avatar_path"] = image_path
        
        # Save all data to file
        print(f"\n💾 Saving data to file...")
        save_results_to_file(channel_data, "kick_data.json")
        
        print(f"\n✅ Data fetching completed for {channel_username}!")
        print(f"📁 Profile image saved to: {image_path if image_path else 'Failed to download'}")
        print(f"📄 Full data saved to: kick_data.json")

if __name__ == "__main__":
    main()
