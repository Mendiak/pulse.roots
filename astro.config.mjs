import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import { slugify } from './src/utils/slug.js';
import { guides } from './src/data/guides.js';

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

// Latest editorial update, used for the guides index and any guide without a
// more specific date in its record.
const guidesLastmod = guides
  .map(guide => guide.updated)
  .sort()
  .at(-1);

const guideLastmodBySlug = new Map(guides.map(guide => [guide.slug, guide.updated]));

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
  },

  integrations: [
    sitemap({
      // `/thanks/` is a noindex confirmation page. `/sitemap/` duplicates the
      // family overview at `/genres/`, so it is noindex and stays out of the
      // XML sitemap; it still passes link equity through its A-Z list.
      filter: (page) => !page.includes('/thanks/') && !/\/sitemap\/$/.test(page),
      serialize(item) {
        // Genre `<lastmod>` used to come from `git log` on the whole dataset, so
        // a single data commit rewrote the date for every genre page. Google
        // learns to ignore a field that changes for hundreds of unrelated URLs
        // at once, so genre pages now ship without it. Guides keep real,
        // per-guide dates.
        const guideMatch = item.url.match(/\/guides\/([^/]+)\/?$/);
        if (guideMatch) {
          const guideDate = guideLastmodBySlug.get(guideMatch[1]) || guidesLastmod;
          if (guideDate) return { ...item, lastmod: new Date(guideDate).toISOString() };
        }
        if (guidesLastmod && /\/guides\/$/.test(item.url)) {
          return { ...item, lastmod: new Date(guidesLastmod).toISOString() };
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
