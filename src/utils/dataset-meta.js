import { execSync } from 'node:child_process';

let cached;

/**
 * Commit date of the genre dataset, used as `dateModified` for genre pages.
 * Cached because the build imports this module once per route render.
 * Returns an empty string when git is unavailable (e.g. shallow clone).
 */
export function genreDatasetLastmod() {
  if (cached !== undefined) return cached;
  try {
    cached = execSync('git log -1 --format=%cI -- public/data/pulseroots.genres.json', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    cached = '';
  }
  return cached;
}
