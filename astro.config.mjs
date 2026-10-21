import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { slugify } from './src/utils/slug.js';

const SITE = 'https://mendiak.github.io/pulse.roots';

/**
 * The old SPA pushed /genres/<path>.html into the address bar and the share
 * button handed those URLs out, so they exist in the wild (and in Search
 * Console) but 404. Generate a meta-refresh page for every genre.
 */
function buildLegacyGenreRedirects() {
  const redirects = {};
  try {
    const data = JSON.parse(fs.readFileSync('public/data/pulseroots.genres.json', 'utf-8'));
    const walk = (items, parts) => {
      for (const item of items) {
        const name = item.name || item.style;
        if (!name) continue;
        const slug = slugify(name);
        const fullPath = [...parts, slug].join('/');
        redirects[`/genres/${fullPath}.html`] = `${SITE}/genres/${fullPath}/`;
        if (item.substyles?.length) walk(item.substyles, [...parts, slug]);
      }
    };
    walk(data, []);
  } catch (error) {
    console.warn('Could not build legacy genre redirects:', error.message);
  }
  return redirects;
}

/**
 * Date of the last change to the genre dataset, used as <lastmod> for genre
 * pages. Falls back to an empty string (no lastmod) when git is unavailable,
 * e.g. in a shallow clone where the file has no history.
 */
let genreDataLastmod = '';
try {
  genreDataLastmod = execSync(
    'git log -1 --format=%cI -- public/data/pulseroots.genres.json',
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
  ).trim();
} catch {
  genreDataLastmod = '';
}

export default defineConfig({
  site: 'https://mendiak.github.io',
  base: '/pulse.roots',
  output: 'static',
  compressHTML: true,
  trailingSlash: 'always',
  prefetch: true,

  // Old URLs produced by the previous slugify(), which stripped diacritics.
  // Static builds get a meta-refresh page so the few existing links keep working.
  // Targets are absolute because Astro does not prefix `base` for static redirects.
  redirects: {
    ...buildLegacyGenreRedirects(),
    '/genres/experimental/musique-concrte/': 'https://mendiak.github.io/pulse.roots/genres/experimental/musique-concrete/',
    '/genres/global-club/funk-carioca/funk-proibido/': 'https://mendiak.github.io/pulse.roots/genres/global-club/funk-carioca/funk-proibidao/',
    '/genres/global-club/funk-carioca/funk-ostentao/': 'https://mendiak.github.io/pulse.roots/genres/global-club/funk-carioca/funk-ostentacao/',
    '/genres/global-club/reggaeton/reggaeton-old-school-clsico/': 'https://mendiak.github.io/pulse.roots/genres/global-club/reggaeton/reggaeton-old-school-clasico/',
    '/genres/global-club/reggaeton/reggaeton-romntico/': 'https://mendiak.github.io/pulse.roots/genres/global-club/reggaeton/reggaeton-romantico/',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
    // Genre pages only exist in the default locale. The previous "es" fallback
    // generated 300+ noindex redirect stubs that wasted crawl budget.
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thanks/'),
      serialize(item) {
        if (genreDataLastmod && item.url.includes('/genres/')) {
          return { ...item, lastmod: new Date(genreDataLastmod).toISOString() };
        }
        return item;
      },
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
        },
      },
    }),
  ],
});
