import requests
import json
import time
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://jloahddizurxqzltkksk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI"

# Twitch API configuration
TWITCH_CLIENT_ID = 'zzsh4vqpt1cv0hp1ia01kd8d5ts3k9'
TWITCH_CLIENT_SECRET = 'd1g4b82crv41hmkgw0j6yymj1oimvf'

def create_supabase_client() -> Client:
    """Create and return a Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_twitch_access_token(client_id: str, client_secret: str) -> str:
    """Get Twitch API access token"""
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
            print(f"❌ Failed to get Twitch access token: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting Twitch access token: {e}")
        return None

def fetch_kick_streamers(supabase: Client) -> List[Dict[str, Any]]:
    """Fetch all streamers with platform='Kick' from Streamers table"""
    try:
        result = supabase.table('Streamers').select('streamer_id, username, channel_id').eq('platform', 'Kick').execute()
        
        if result.data:
            print(f"📋 Found {len(result.data)} Kick streamers")
            return result.data
        else:
            print("❌ No Kick streamers found")
            return []
    except Exception as e:
        print(f"❌ Error fetching Kick streamers: {e}")
        return []

def get_kick_follower_count(username: str) -> int:
    """Get follower count for a Kick user using Kick API"""
    try:
        from kickapi import KickAPI
        
        # Create an instance of KickAPI
        kick_api = KickAPI()
        
        # Fetch channel data by username
        channel = kick_api.channel(username)
        
        if not channel:
            print(f"⚠️ Channel '{username}' not found on Kick")
            return 0
        
        # Get follower count
        followers = getattr(channel, 'followers', 0)
        if followers is None:
            followers = 0
            
        return followers
        
    except Exception as e:
        print(f"⚠️ Error fetching Kick follower count for {username}: {e}")
        return 0

def generate_current_price() -> float:
    """Generate random current price between 2.5 and 6.5"""
    return round(np.random.uniform(2.5, 6.5), 2)

def generate_past_prices(current_price: float) -> List[float]:
    """Generate past 7 days' prices using the same logic as datatrend.py"""
    trend_type = np.random.choice(['upward', 'downward', 'random'])
    
    if trend_type == 'upward':
        end = current_price + np.random.uniform(0.5, 2.0)
        step = (end - current_price) / 7
        return [float(round(current_price + i * step + np.random.normal(0, 0.1), 2)) for i in range(7)]
    elif trend_type == 'downward':
        end = max(0, current_price - np.random.uniform(0.5, 2.0))
        step = (current_price - end) / 7
        return [float(round(current_price - i * step + np.random.normal(0, 0.1), 2)) for i in range(7)]
    else:
        return [float(round(np.clip(current_price + np.random.uniform(-2.0, 2.0), 0, None), 2)) for _ in range(7)]

def process_kick_streamers(supabase: Client, twitch_client_id: str, twitch_access_token: str) -> List[Dict[str, Any]]:
    """Process Kick streamers and generate stats data"""
    # Fetch Kick streamers
    kick_streamers = fetch_kick_streamers(supabase)
    
    if not kick_streamers:
        print("❌ No Kick streamers to process")
        return []
    
    results = []
    
    for i, streamer in enumerate(kick_streamers, 1):
        username = streamer['username']
        streamer_id = streamer['streamer_id']
        
        print(f"\n📺 Processing {i}/{len(kick_streamers)}: {username}")
        
        # Get real follower count from Kick API
        follower_count = get_kick_follower_count(username)
        print(f"   👥 Kick followers: {follower_count:,}")
        
        # Generate current price
        current_price = generate_current_price()
        print(f"   💰 Current price: ${current_price}")
        
        # Generate past 7 days' prices
        past_prices = generate_past_prices(current_price)
        print(f"   📈 Past prices: {past_prices}")
        
        # Create stats record with generated followers
        stats_record = {
            'streamer_id': streamer_id,
            'followers': follower_count,
            'current_price': current_price,
            'day_1_price': past_prices[0],
            'day_2_price': past_prices[1],
            'day_3_price': past_prices[2],
            'day_4_price': past_prices[3],
            'day_5_price': past_prices[4],
            'day_6_price': past_prices[5],
            'day_7_price': past_prices[6]
        }
        
        results.append(stats_record)
        print(f"   ✅ Processed {username}")
        
        # Rate limiting - small delay between requests
        time.sleep(0.5)
    
    return results

def upload_to_streamer_stats(supabase: Client, stats_data: List[Dict[str, Any]], batch_size: int = 5) -> bool:
    """Upload stats data to StreamerStats table"""
    try:
        total_records = len(stats_data)
        successful_uploads = 0
        
        print(f"\n🚀 Starting upload of {total_records} records to StreamerStats...")
        
        # Process data in batches
        for i in range(0, total_records, batch_size):
            batch = stats_data[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_records + batch_size - 1) // batch_size
            
            print(f"📤 Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
            
            # Upsert batch into StreamerStats table (insert or update)
            result = supabase.table('StreamerStats').upsert(batch).execute()
            
            if result.data:
                successful_uploads += len(batch)
                print(f"✅ Batch {batch_num} uploaded successfully")
            else:
                print(f"❌ Failed to upload batch {batch_num}")
                if hasattr(result, 'error') and result.error:
                    print(f"   Error: {result.error}")
        
        print(f"\n📊 Upload Summary:")
        print(f"   Total records: {total_records}")
        print(f"   Successfully uploaded: {successful_uploads}")
        print(f"   Failed: {total_records - successful_uploads}")
        
        return successful_uploads == total_records
        
    except Exception as e:
        print(f"❌ Error uploading to StreamerStats: {e}")
        return False

def save_to_csv(stats_data: List[Dict[str, Any]], filename: str = "kick_streamer_stats.csv"):
    """Save stats data to CSV for backup"""
    try:
        df = pd.DataFrame(stats_data)
        df.to_csv(filename, index=False)
        print(f"💾 Data saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving CSV: {e}")

def main():
    """Main function to process Kick streamers and upload stats"""
    print("🚀 Starting Kick Streamer Stats Processing...")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Create Supabase client
    print("🔗 Connecting to Supabase...")
    supabase = create_supabase_client()
    
    # Get Twitch access token
    print("🔑 Getting Twitch API access token...")
    twitch_access_token = get_twitch_access_token(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)
    
    if not twitch_access_token:
        print("❌ Could not get Twitch access token. Exiting.")
        return
    
    print("✅ Twitch access token obtained")
    
    # Process Kick streamers
    print("\n📊 Processing Kick streamers...")
    stats_data = process_kick_streamers(supabase, TWITCH_CLIENT_ID, twitch_access_token)
    
    if not stats_data:
        print("❌ No stats data generated")
        return
    
    # Save to CSV
    print("\n💾 Saving data to CSV...")
    save_to_csv(stats_data, "kick_streamer_stats_with_followers.csv")
    
    # Skip Supabase upload - just generate CSV
    print("\n📄 CSV generation completed!")
    print("✅ All data processed and saved to CSV file")

if __name__ == "__main__":
    main()
