import json
import base64
import requests
import re

CLIENT_ID = "4c30441122b046faa6e2389e6f69f8ec"
CLIENT_SECRET = "40891f0810b24911aa001415041e63b8"

def get_spotify_token():
    auth_string = CLIENT_ID + ":" + CLIENT_SECRET
    auth_base64 = str(base64.b64encode(auth_string.encode("utf-8")), "utf-8")
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + auth_base64,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    result = requests.post(url, headers=headers, data=data)
    json_result = json.loads(result.content)
    return json_result["access_token"]

def search_artist(token, artist_name):
    url = "https://api.spotify.com/v1/search"
    headers = {"Authorization": "Bearer " + token}
    query = f"?q={artist_name}&type=artist&limit=1"
    query_url = url + query
    result = requests.get(query_url, headers=headers)
    json_result = json.loads(result.content)
    
    if "artists" in json_result and json_result["artists"]["items"]:
        artist = json_result["artists"]["items"][0]
        return artist["external_urls"]["spotify"]
    return None

def process_genres(genres, token):
    updated_count = 0
    for genre in genres:
        style_name = genre.get("style") or genre.get("name")
        print(f"Checking style: {style_name}")
        
        # Traverse substyles first (they might be in 'substyles' key)
        if "substyles" in genre:
            updated_count += process_genres(genre["substyles"], token)
            
        if "key_artists" in genre:
            for artist in genre["key_artists"]:
                artist_name = artist.get("name")
                artist_url = artist.get("url", "")
                
                # Update if URL is missing, empty, or not a real spotify artist link
                if not artist_url or "spotify.com/artist" not in artist_url or artist_url == "https://open.spotify.com/artist/":
                    print(f"  Searching for artist: {artist_name}...")
                    url = search_artist(token, artist_name)
                    if url:
                        artist["url"] = url
                        updated_count += 1
                        print(f"    Found: {url}")
                    else:
                        print(f"    Not found.")
    return updated_count

def main():
    token = get_spotify_token()
    with open("pulseroots.genres.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Process all genres
    print("Processing all genres...")
    count = process_genres(data, token)
    print(f"Updated {count} artists in total.")
    
    with open("pulseroots.genres.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    main()
