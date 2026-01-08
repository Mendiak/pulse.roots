import json

def audit_experimental():
    with open("pulseroots.genres.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    experimental = next((g for g in data if g.get("style") == "Experimental"), None)
    if not experimental:
        print("Experimental family not found!")
        return

    def check_genre(g, path):
        name = g.get("name") or g.get("style")
        current_path = path + " -> " + name
        artists = g.get("key_artists", [])
        print(f"{current_path}: {len(artists)} artists")
        
        for sub in g.get("substyles", []):
            check_genre(sub, current_path)

    for family in data:
        check_genre(family, "Root")

if __name__ == "__main__":
    audit_experimental()
