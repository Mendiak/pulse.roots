import { execSync } from 'node:child_process';

const cache = new Map();

/**
 * Commit date of a genre dataset, used as `dateModified` for genre pages.
 * Cached per file because the build imports this module once per route render.
 * Returns an empty string when git is unavailable (e.g. shallow clone).
 */
export function genreDatasetLastmod(lang = 'en') {
  const file = lang === 'en'
    ? 'public/data/pulseroots.genres.json'
    : `public/data/pulseroots.genres.${lang}.json`;

  if (cache.has(file)) return cache.get(file);

  let value = '';
  try {
    value = execSync(`git log -1 --format=%cI -- ${file}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    value = '';
  }

  cache.set(file, value);
  return value;
}
