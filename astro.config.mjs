import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import { execSync } from 'node:child_process';

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
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
});
