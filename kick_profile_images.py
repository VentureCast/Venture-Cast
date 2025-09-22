import requests
import os
import time
from typing import List, Dict, Any
from supabase import create_client, Client
from kickapi import KickAPI

# Supabase configuration
SUPABASE_URL = "https://jloahddizurxqzltkksk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI"

def create_supabase_client() -> Client:
    """Create and return a Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_kick_streamers(supabase: Client) -> List[Dict[str, Any]]:
    """Fetch all streamers with platform='Kick' from Streamers table"""
    try:
        result = supabase.table('Streamers').select('streamer_id, username').eq('platform', 'Kick').execute()
        
        if result.data:
            print(f"📋 Found {len(result.data)} Kick streamers")
            return result.data
        else:
            print("❌ No Kick streamers found")
            return []
    except Exception as e:
        print(f"❌ Error fetching Kick streamers: {e}")
        return []

def download_image(url: str, path: str) -> bool:
    """Download an image from URL and save it locally"""
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

def get_kick_profile_image_url(username: str) -> str:
    """Get profile image URL for a Kick user using Kick API"""
    try:
        # Create an instance of KickAPI
        kick_api = KickAPI()
        
        # Fetch channel data by username
        channel = kick_api.channel(username)
        
        if not channel:
            print(f"⚠️ Channel '{username}' not found on Kick")
            return ""
        
        # Get avatar URL
        avatar_url = getattr(channel, 'avatar', '')
        if not avatar_url:
            print(f"⚠️ No avatar URL found for {username}")
            return ""
            
        return avatar_url
        
    except Exception as e:
        print(f"⚠️ Error fetching Kick profile image URL for {username}: {e}")
        return ""

def process_kick_profile_images(supabase: Client, image_dir: str) -> Dict[str, Any]:
    """Process Kick streamers and download their profile images"""
    # Fetch Kick streamers
    kick_streamers = fetch_kick_streamers(supabase)
    
    if not kick_streamers:
        print("❌ No Kick streamers to process")
        return {}
    
    # Create image directory
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
        print(f"📁 Created directory: {image_dir}")
    
    results = {}
    
    for i, streamer in enumerate(kick_streamers, 1):
        username = streamer['username']
        streamer_id = streamer['streamer_id']
        
        print(f"\n📺 Processing {i}/{len(kick_streamers)}: {username}")
        
        # Get profile image URL from Kick API
        avatar_url = get_kick_profile_image_url(username)
        
        if not avatar_url:
            print(f"   ⚠️ No avatar URL found for {username}")
            results[username] = {"error": "No avatar URL found"}
            continue
        
        print(f"   🖼 Avatar URL: {avatar_url}")
        
        # Determine file extension
        ext = os.path.splitext(avatar_url)[1].split('?')[0] or '.png'
        if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
            ext = '.png'
        
        # Create filename: streamer_name+kick.png
        filename = f"{username}+kick{ext}"
        local_path = os.path.join(image_dir, filename)
        
        # Download the image
        if download_image(avatar_url, local_path):
            print(f"   ✅ Downloaded: {filename}")
            results[username] = {
                "success": True,
                "filename": filename,
                "local_path": local_path,
                "avatar_url": avatar_url
            }
        else:
            print(f"   ❌ Failed to download: {filename}")
            results[username] = {
                "error": "Failed to download image",
                "avatar_url": avatar_url
            }
        
        # Rate limiting - small delay between requests
        time.sleep(0.5)
    
    return results

def save_results_to_file(results: Dict[str, Any], filename: str = "kick_profile_images.json"):
    """Save results to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            import json
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"💾 Results saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving results to file: {e}")

def main():
    """Main function to download Kick profile images"""
    print("🚀 Starting Kick Profile Images Download...")
    
    # Create Supabase client
    print("🔗 Connecting to Supabase...")
    supabase = create_supabase_client()
    
    # Process Kick profile images
    print("\n📸 Processing Kick profile images...")
    image_dir = "kick_profile_images"
    results = process_kick_profile_images(supabase, image_dir)
    
    # Save results to JSON
    print("\n💾 Saving results...")
    save_results_to_file(results)
    
    # Summary
    successful_downloads = sum(1 for result in results.values() if result.get('success', False))
    total_streamers = len(results)
    
    print(f"\n📊 Download Summary:")
    print(f"   Total streamers: {total_streamers}")
    print(f"   Successfully downloaded: {successful_downloads}")
    print(f"   Failed: {total_streamers - successful_downloads}")
    print(f"   Images saved to: {image_dir}/")
    
    if successful_downloads > 0:
        print(f"\n✅ Profile images download completed!")
        print(f"📁 Check the '{image_dir}' folder for downloaded images")
    else:
        print(f"\n❌ No images were downloaded successfully")

if __name__ == "__main__":
    main()
