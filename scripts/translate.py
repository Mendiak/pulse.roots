import json
import os
import sys
import time
import re
from deep_translator import GoogleTranslator

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

GENRES_INPUT = os.path.join(DATA_DIR, 'pulseroots.genres.json')
GENRES_OUTPUT = os.path.join(DATA_DIR, 'pulseroots.genres.es.json')
HISTORY_INPUT = os.path.join(DATA_DIR, 'music_history.json')
HISTORY_OUTPUT = os.path.join(DATA_DIR, 'music_history.es.json')

translator = GoogleTranslator(source='en', target='es')

def untag_text(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
    return text

def translate_text(text, retries=3):
    if not text or not text.strip():
        return text
    for attempt in range(retries):
        try:
            result = translator.translate(text)
            time.sleep(0.3)
            return result
        except Exception as e:
            print(f"  Retry {attempt+1}/{retries}: {e}")
            time.sleep(2)
    print(f"  FAILED after {retries} retries")
    return text

def translate_tree(items, depth=0):
    indent = '  ' * depth
    count = 0
    for i, item in enumerate(items):
        name = item.get('name') or item.get('style') or 'unknown'

        if 'description' in item and item['description']:
            desc = item['description']
            if len(desc) > 5:
                print(f"{indent}[{i+1}/{len(items)}] Translating \"{name}\"...", end=' ')
                sys.stdout.flush()
                try:
                    translated = translate_text(desc)
                    item['description'] = translated
                    print('OK')
                    count += 1
                except Exception as e:
                    print(f'ERROR: {e}')

        if 'substyles' in item and item['substyles']:
            c = translate_tree(item['substyles'], depth + 1)
            count += c

    return count

def translate_history(items):
    total = len(items)
    count = 0
    for i, item in enumerate(items):
        if 'fact' in item and item['fact']:
            print(f"  History [{i+1}/{total}] ({item.get('date', '')})...", end=' ')
            sys.stdout.flush()
            try:
                translated = translate_text(item['fact'])
                item['fact'] = translated
                print('OK')
                count += 1
            except Exception as e:
                print(f'ERROR: {e}')
    return count

def main():
    print("=" * 60)
    print("PulseRoots Translation Script (EN -> ES)")
    print("=" * 60)

    # --- Translate genres ---
    print("\n--- Translating genre descriptions ---")
    with open(GENRES_INPUT, 'r', encoding='utf-8') as f:
        genres_data = json.load(f)
    print(f"Loaded {len(genres_data)} top-level genres")

    genre_count = translate_tree(genres_data)
    print(f"\nTranslated {genre_count} genre descriptions")

    with open(GENRES_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(genres_data, f, ensure_ascii=False, indent=4)
    print(f"Written to: {GENRES_OUTPUT}")

    # --- Translate history ---
    print("\n--- Translating music history ---")
    with open(HISTORY_INPUT, 'r', encoding='utf-8') as f:
        history_data = json.load(f)
    print(f"Loaded {len(history_data)} history entries")

    history_count = translate_history(history_data)
    print(f"\nTranslated {history_count} history entries")

    with open(HISTORY_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(history_data, f, ensure_ascii=False, indent=2)
    print(f"Written to: {HISTORY_OUTPUT}")

    print("\n" + "=" * 60)
    print("Translation complete!")
    print(f"  Genres: {genre_count} descriptions")
    print(f"  History: {history_count} entries")
    print("=" * 60)

if __name__ == '__main__':
    main()
