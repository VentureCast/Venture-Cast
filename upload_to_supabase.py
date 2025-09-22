import csv
import uuid
import os
from supabase import create_client, Client
from typing import List, Dict, Any

# Supabase configuration
SUPABASE_URL = "https://jloahddizurxqzltkksk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsb2FoZGRpenVyeHF6bHRra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDI1NjAsImV4cCI6MjA1MDQ3ODU2MH0.MymEhssDThYw5l3EdADOaMX_MDlkE3UeBdPcM-lrajI"

def create_supabase_client() -> Client:
    """Create and return a Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def read_csv_data(csv_file: str) -> List[Dict[str, Any]]:
    """Read CSV data and return as list of dictionaries"""
    data = []
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
        print(f"📋 Read {len(data)} records from {csv_file}")
        return data
    except Exception as e:
        print(f"❌ Error reading CSV file {csv_file}: {e}")
        return []

def transform_data_for_supabase(csv_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform CSV data to match Supabase Streamers table schema"""
    transformed_data = []
    
    for row in csv_data:
        # Generate a random UUID for streamer_id
        streamer_id = str(uuid.uuid4())
        
        # Map CSV columns to Supabase table columns
        transformed_row = {
            'streamer_id': streamer_id,
            'platform': row.get('platform', 'Kick'),
            'username': row.get('username', ''),
            'channel_id': row.get('channel_id', ''),
            'category': row.get('category', 'Streaming'),
            'created_at': None if row.get('created_at') == 'NULL' or row.get('created_at') == '' else row.get('created_at'),
            'ticker_name': None if row.get('ticker_name') == 'NULL' or row.get('ticker_name') == '' else row.get('ticker_name'),
            'total_shares': int(row.get('total_shares', 1000000)) if row.get('total_shares') != 'NULL' and row.get('total_shares') != '' else 1000000,
            'profile_picture_path': None if row.get('profile_picture_path') == 'NULL' or row.get('profile_picture_path') == '' else row.get('profile_picture_path')
        }
        
        transformed_data.append(transformed_row)
    
    print(f"🔄 Transformed {len(transformed_data)} records for Supabase")
    
    # Debug: Print first record to check format
    if transformed_data:
        print(f"🔍 Sample record: {transformed_data[0]}")
    
    return transformed_data

def upload_to_supabase(supabase: Client, data: List[Dict[str, Any]], batch_size: int = 10) -> bool:
    """Upload data to Supabase Streamers table in batches"""
    try:
        total_records = len(data)
        successful_uploads = 0
        
        print(f"🚀 Starting upload of {total_records} records to Supabase...")
        
        # Process data in batches to avoid overwhelming the API
        for i in range(0, total_records, batch_size):
            batch = data[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_records + batch_size - 1) // batch_size
            
            print(f"📤 Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
            
            # Insert batch into Supabase
            result = supabase.table('Streamers').insert(batch).execute()
            
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
        print(f"❌ Error uploading to Supabase: {e}")
        return False

def verify_upload(supabase: Client, expected_count: int) -> bool:
    """Verify that the upload was successful by counting records"""
    try:
        result = supabase.table('Streamers').select('streamer_id', count='exact').execute()
        
        if result.count is not None:
            print(f"🔍 Verification: Found {result.count} total records in Streamers table")
            return True
        else:
            print("❌ Could not verify upload - unable to count records")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying upload: {e}")
        return False

def main():
    """Main function to upload CSV data to Supabase"""
    csv_file = "kick_batch_output.csv"
    
    print("🚀 Starting CSV to Supabase upload process...")
    
    # Check if CSV file exists
    if not os.path.exists(csv_file):
        print(f"❌ CSV file {csv_file} not found")
        return
    
    # Create Supabase client
    print("🔗 Connecting to Supabase...")
    supabase = create_supabase_client()
    
    # Read CSV data
    print(f"📖 Reading data from {csv_file}...")
    csv_data = read_csv_data(csv_file)
    
    if not csv_data:
        print("❌ No data found in CSV file")
        return
    
    # Transform data for Supabase
    print("🔄 Transforming data for Supabase...")
    transformed_data = transform_data_for_supabase(csv_data)
    
    # Upload to Supabase
    print("📤 Uploading to Supabase...")
    success = upload_to_supabase(supabase, transformed_data)
    
    if success:
        print("✅ Upload completed successfully!")
        
        # Verify upload
        print("🔍 Verifying upload...")
        verify_upload(supabase, len(transformed_data))
        
    else:
        print("❌ Upload failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
