import os
from PIL import Image
import json

def convert_webp_to_png(input_dir: str, output_dir: str = None):
    """Convert all .webp images to .png and rename them"""
    
    if output_dir is None:
        output_dir = input_dir
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Created directory: {output_dir}")
    
    # Get all .webp files in the input directory
    webp_files = [f for f in os.listdir(input_dir) if f.endswith('.webp')]
    
    if not webp_files:
        print("❌ No .webp files found in the directory")
        return
    
    print(f"🔄 Found {len(webp_files)} .webp files to convert")
    
    converted_files = []
    
    for webp_file in webp_files:
        input_path = os.path.join(input_dir, webp_file)
        
        # Create new filename: remove +kick.webp and add kick.png
        # Example: "cheesur+kick.webp" -> "cheesurkick.png"
        base_name = webp_file.replace('+kick.webp', '')
        png_filename = f"{base_name}kick.png"
        output_path = os.path.join(output_dir, png_filename)
        
        try:
            # Open the .webp image
            with Image.open(input_path) as img:
                # Convert to RGB if necessary (for RGBA images)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save as PNG
                img.save(output_path, 'PNG')
                
                print(f"✅ Converted: {webp_file} -> {png_filename}")
                converted_files.append({
                    'original': webp_file,
                    'converted': png_filename,
                    'input_path': input_path,
                    'output_path': output_path
                })
                
        except Exception as e:
            print(f"❌ Error converting {webp_file}: {e}")
    
    return converted_files

def update_json_file(json_file: str, converted_files: list):
    """Update the JSON file with new filenames"""
    try:
        # Read existing JSON
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Update filenames in the JSON
        for conversion in converted_files:
            original_filename = conversion['original']
            new_filename = conversion['converted']
            
            # Find the streamer name from the original filename
            streamer_name = original_filename.replace('+kick.webp', '')
            
            if streamer_name in data:
                data[streamer_name]['filename'] = new_filename
                data[streamer_name]['local_path'] = data[streamer_name]['local_path'].replace(original_filename, new_filename)
                print(f"📝 Updated JSON for {streamer_name}: {original_filename} -> {new_filename}")
        
        # Save updated JSON
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Updated {json_file} with new filenames")
        
    except Exception as e:
        print(f"❌ Error updating JSON file: {e}")

def remove_original_webp_files(input_dir: str, converted_files: list):
    """Remove the original .webp files after successful conversion"""
    for conversion in converted_files:
        try:
            os.remove(conversion['input_path'])
            print(f"🗑️ Removed original: {conversion['original']}")
        except Exception as e:
            print(f"⚠️ Could not remove {conversion['original']}: {e}")

def main():
    """Main function to convert Kick profile images"""
    print("🚀 Starting Kick Profile Images Conversion...")
    
    input_dir = "kick_profile_images"
    json_file = "kick_profile_images.json"
    
    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f"❌ Directory {input_dir} not found")
        return
    
    # Convert images
    print(f"\n🔄 Converting images in {input_dir}...")
    converted_files = convert_webp_to_png(input_dir)
    
    if not converted_files:
        print("❌ No files were converted")
        return
    
    # Update JSON file
    print(f"\n📝 Updating JSON file...")
    update_json_file(json_file, converted_files)
    
    # Remove original .webp files
    print(f"\n🗑️ Removing original .webp files...")
    remove_original_webp_files(input_dir, converted_files)
    
    # Summary
    print(f"\n📊 Conversion Summary:")
    print(f"   Files converted: {len(converted_files)}")
    print(f"   Output directory: {input_dir}/")
    print(f"   JSON file updated: {json_file}")
    
    print(f"\n✅ Image conversion completed!")
    print(f"📁 All images are now in PNG format with updated naming")

if __name__ == "__main__":
    main()

