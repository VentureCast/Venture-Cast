import requests
import json
import time
import os
from typing import List, Dict, Any

def get_access_token(client_id: str, client_secret: str) -> str:
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

def download_image(url: str, path: str) -> bool:
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

def fetch_and_download_profile_images(channel_names: List[str], client_id: str, access_token: str, image_dir: str) -> Dict[str, Any]:
    base_url = "https://api.twitch.tv/helix/users"
    results = {}
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'VentureCast/1.0',
        'Client-ID': client_id,
        'Authorization': f'Bearer {access_token}'
    }
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
    for channel_name in channel_names:
        try:
            url = f"{base_url}?login={channel_name}"
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get('data') and len(data['data']) > 0:
                    img_url = data['data'][0]['profile_image_url']
                    ext = os.path.splitext(img_url)[1].split('?')[0] or '.jpg'
                    if ext.lower() not in ['.jpg', '.jpeg', '.png']:
                        ext = '.jpg'
                    local_path = os.path.join(image_dir, f"{channel_name}{ext}")
                    if download_image(img_url, local_path):
                        results[channel_name] = local_path
                        print(f"✅ {channel_name}: {img_url} -> {local_path}")
                    else:
                        results[channel_name] = {"error": f"Failed to download image", "url": img_url}
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

def save_results_to_file(results: Dict[str, Any], filename: str = "twitch_profile_images.json"):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"💾 Data saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving data to file: {e}")

def main():
    client_id = 'zzsh4vqpt1cv0hp1ia01kd8d5ts3k9'
    client_secret = 'd1g4b82crv41hmkgw0j6yymj1oimvf'
    channel_names = [
        "Jerma985",
        "PGL_CS2",
        "TenZ",
        "Lacy",
        "girlhefunny1x",
        "CohhCarnage",
        "Emiru",
        "AussieAntics",
        "lydiaviolet",
        "RDCgaming",
        "easportsfc",
        "Clix",
        "Caedrel",
        "VALORANT_EMEA",
        "yourragegaming",
        "LCK",
        "plaqueboymax",
        "Agent00",
        "jidionpremium",
        "ballerleagueuk",
        "jasontheween",
        "LTANorth",
        "Thebausffs",
        "summit1g",
        "LEC",
        "tarik",
        "Grubby",
        "Thetylilshow",
        "Ludwig",
        "Warframe",
        "2xRaKai",
        "MrSavage",
        "DDG",
        "relog_cs_c",
        "ohnePixel",
        "PaymoneyWubby",
        "Adapt",
        "Northernlion",
        "TimTheTatman",
        "forsen",
        "Necros",
        "SypherPK",
        "xQc",
        "NICKMERCS",
        "VALORANT_Americas",
        "rayasianboy",
        "RocketLeague",
        "PGL",
        "KaiCenat",
        "Silky",
        "angryginge13",
        "AustinShow",
        "shroud",
        "Mizkif",
        "pokimane",
        "PirateSoftware",
        "scump",
        "Vinesauce",
        "Gorgc",
        "Maximilian_DOOD",
        "Ninja",
        "Zizaran",
        "Duke",
        "Lord_Kebun",
        "BotezLive",
        "Jynxzi",
        "sodapoppin",
        "marlon",
        "zackrawrr",
        "Valkyrae",
        "Unboxholics",
        "Quin69",
        "VALORANT_Pacific",
        "GoodTimesWithScar",
        "stableronaldo",
        "DougDoug",
        "fissure_dota_en",
        "HasanAbi",
        "EMEAMasters",
        "ironmouse",
        "wendolynortizz",
        "Arteezy",
        "ExtraEmily",
        "caseoh_",
        "WorldofTanks",
        "marathonthegame",
        "Elajjaz",
        "Pikabooirl",
        "loltyler1",
        "k3soju",
        "LIRIK",
        "vedal987",
        "MOONMOON",
        "BLASTPremier",
        "caprisun",
        "QuickyBaby",
        "cdawg"
    ]
    image_dir = "profile_images"
    print("🚀 Fetching and downloading Twitch profile images...")
    access_token = get_access_token(client_id, client_secret)
    if not access_token:
        print("❌ Could not get access token. Exiting.")
        return
    results = fetch_and_download_profile_images(channel_names, client_id, access_token, image_dir)
    save_results_to_file(results)

if __name__ == "__main__":
    main() 