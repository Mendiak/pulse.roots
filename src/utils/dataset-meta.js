import { execSync } from 'node:child_process';

const cache = new Map();

function git(args) {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Commit date of a genre dataset, used as `dateModified` for genre pages and as
 * `<lastmod>` in the sitemap.
 * Cached per file because the build imports this module once per route render.
 *
 * In a shallow clone (`actions/checkout` defaults to depth 1) git treats the
 * boundary commit as if it had touched every file, so `git log -- <file>`
 * reports the deploy commit instead of the commit that actually changed the
 * dataset. That rewrote `<lastmod>` for all 616 genre URLs on every deploy,
 * which teaches Google to distrust the value. Fall back to an empty string:
 * no `<lastmod>` is better than one that is always wrong. The deploy workflow
 * checks out the full history so this branch should not be hit in CI.
 */
export function genreDatasetLastmod(lang = 'en') {
  const file = lang === 'en'
    ? 'public/data/pulseroots.genres.json'
    : `public/data/pulseroots.genres.${lang}.json`;

  if (cache.has(file)) return cache.get(file);

  const isShallow = git('rev-parse --is-shallow-repository') === 'true';
  const value = isShallow ? '' : git(`log -1 --format=%cI -- ${file}`);

  cache.set(file, value);
  return value;
}
