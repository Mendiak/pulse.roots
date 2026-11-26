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
 * Commit date of a genre dataset. Used only as `dateModified` in the genre
 * pages' structured data; the XML sitemap no longer emits a `<lastmod>` for
 * genre URLs, because a single dataset commit touched every page at once and
 * Google stops trusting a field that changes for hundreds of unrelated URLs.
 * Cached per file because the build imports this module once per route render.
 *
 * In a shallow clone (`actions/checkout` defaults to depth 1) git treats the
 * boundary commit as if it had touched every file, so `git log -- <file>`
 * reports the deploy commit instead of the commit that actually changed the
 * dataset. Fall back to an empty string: no date is better than one that is
 * always wrong. The deploy workflow checks out the full history so this
 * branch should not be hit in CI.
 */
/**
 * Files whose content is rendered into every genre page. When one of these
 * changes, the genre pages really did change, so `dateModified` must move
 * with it instead of staying frozen on the dataset commit.
 */
const GENRE_TEMPLATE_FILES = [
  'src/components/GenrePage.astro',
  'src/utils/genre-paths.js',
  'src/utils/genres-data.js',
  'src/styles/layout.css',
  'astro.config.mjs',
];

export function genreDatasetLastmod(lang = 'en') {
  const file = lang === 'en'
    ? 'public/data/pulseroots.genres.json'
    : `public/data/pulseroots.genres.${lang}.json`;

  if (cache.has(file)) return cache.get(file);

  const isShallow = git('rev-parse --is-shallow-repository') === 'true';
  const paths = [file, ...GENRE_TEMPLATE_FILES].join(' ');
  const value = isShallow ? '' : git(`log -1 --format=%cI -- ${paths}`);

  cache.set(file, value);
  return value;
}
