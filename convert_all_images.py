import os
from PIL import Image
import json

def convert_profile_images_to_png(input_dir: str, output_dir: str = None):
    """Convert all images in profile_images directory to PNG format"""
    
    if output_dir is None:
        output_dir = input_dir
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Created directory: {output_dir}")
    
    # Get all image files in the input directory
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff']
    image_files = [f for f in os.listdir(input_dir) if any(f.lower().endswith(ext) for ext in image_extensions)]
    
    if not image_files:
        print("❌ No image files found in the directory")
        return []
    
    print(f"🔄 Found {len(image_files)} image files to convert in {input_dir}")
    
    converted_files = []
    
    for image_file in image_files:
        input_path = os.path.join(input_dir, image_file)
        
        # Create new filename: change extension to .png
        base_name = os.path.splitext(image_file)[0]
        png_filename = f"{base_name}.png"
        output_path = os.path.join(output_dir, png_filename)
        
        try:
            # Open the image
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
                
                print(f"✅ Converted: {image_file} -> {png_filename}")
                converted_files.append({
                    'original': image_file,
                    'converted': png_filename,
                    'input_path': input_path,
                    'output_path': output_path
                })
                
                # Remove original file if it's not already PNG
                if not image_file.lower().endswith('.png'):
                    try:
                        os.remove(input_path)
                        print(f"🗑️ Removed original: {image_file}")
                    except Exception as e:
                        print(f"⚠️ Could not remove {image_file}: {e}")
                
        except Exception as e:
            print(f"❌ Error converting {image_file}: {e}")
    
    return converted_files

def remove_kick_from_filenames(kick_dir: str):
    """Remove 'kick' from filenames in kick_profile_images directory"""
    
    if not os.path.exists(kick_dir):
        print(f"❌ Directory {kick_dir} not found")
        return []
    
    # Get all .png files in the kick directory
    png_files = [f for f in os.listdir(kick_dir) if f.endswith('.png') and 'kick' in f]
    
    if not png_files:
        print("❌ No files with 'kick' found in the directory")
        return []
    
    print(f"🔄 Found {len(png_files)} files with 'kick' to rename in {kick_dir}")
    
    renamed_files = []
    
    for png_file in png_files:
        old_path = os.path.join(kick_dir, png_file)
        
        # Remove 'kick' from filename
        new_filename = png_file.replace('kick', '')
        new_path = os.path.join(kick_dir, new_filename)
        
        try:
            # Rename the file
            os.rename(old_path, new_path)
            print(f"✅ Renamed: {png_file} -> {new_filename}")
            renamed_files.append({
                'original': png_file,
                'renamed': new_filename,
                'old_path': old_path,
                'new_path': new_path
            })
            
        except Exception as e:
            print(f"❌ Error renaming {png_file}: {e}")
    
    return renamed_files

def update_kick_json_file(json_file: str, renamed_files: list):
    """Update the kick_profile_images.json file with new filenames"""
    try:
        # Read existing JSON
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Update filenames in the JSON
        for rename in renamed_files:
            original_filename = rename['original']
            new_filename = rename['renamed']
            
            # Find the streamer name from the original filename
            # Example: "cheesurkick.png" -> "cheesur"
            streamer_name = original_filename.replace('kick.png', '')
            
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

def main():
    """Main function to convert all images and rename kick files"""
    print("🚀 Starting Image Conversion and Renaming...")
    
    # Convert profile_images to PNG
    print(f"\n🔄 Converting profile_images to PNG...")
    profile_dir = "profile_images"
    converted_profile_files = convert_profile_images_to_png(profile_dir)
    
    # Remove 'kick' from kick_profile_images filenames
    print(f"\n🔄 Removing 'kick' from kick_profile_images filenames...")
    kick_dir = "kick_profile_images"
    renamed_kick_files = remove_kick_from_filenames(kick_dir)
    
    # Update kick JSON file
    if renamed_kick_files:
        print(f"\n📝 Updating kick_profile_images.json...")
        update_kick_json_file("kick_profile_images.json", renamed_kick_files)
    
    # Summary
    print(f"\n📊 Conversion and Renaming Summary:")
    print(f"   Profile images converted: {len(converted_profile_files)}")
    print(f"   Kick images renamed: {len(renamed_kick_files)}")
    print(f"   Profile directory: {profile_dir}/")
    print(f"   Kick directory: {kick_dir}/")
    
    if converted_profile_files or renamed_kick_files:
        print(f"\n✅ Image conversion and renaming completed!")
    else:
        print(f"\n❌ No files were processed")

if __name__ == "__main__":
    main()
