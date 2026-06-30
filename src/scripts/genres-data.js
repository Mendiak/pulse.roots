import fs from 'fs';
import path from 'path';

export function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function loadGenres(lang) {
  const dataDir = path.resolve(process.cwd(), 'data');
  const isDefaultLang = lang === 'en';
  const fileName = isDefaultLang ? 'pulseroots.genres.json' : `pulseroots.genres.${lang}.json`;
  let filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(dataDir, 'pulseroots.genres.json');
  }
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function flattenGenres(genres, lang = 'en') {
  const allGenres = [];
  const traverse = (items, slugParts, breadcrumbs) => {
    for (const item of items) {
      const name = item.name || item.style;
      if (!name) continue;
      const slug = slugify(name);
      const fullSlugPath = [...slugParts, slug].join('/');
      allGenres.push({
        genreName: name,
        fullSlugPath,
        breadcrumbs: [...breadcrumbs],
        description: item.description || '',
        wikipediaUrl: item.wikipedia_url || '',
        spotifyTrackId: item.spotify_track_id || '',
        exampleTrack: item.example || '',
        keyArtists: item.key_artists || [],
        substyles: item.substyles || [],
        children: (item.substyles || []).map(child => ({
          name: child.name || child.style,
          slug: slugify(child.name || child.style || ''),
        })),
      });
      if (item.substyles && item.substyles.length > 0) {
        traverse(item.substyles, [...slugParts, slug], [...breadcrumbs, { name, slug }]);
      }
    }
  };
  traverse(genres, [], []);
  return allGenres;
}
