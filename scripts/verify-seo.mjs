/**
 * Static SEO/quality gate for the built site.
 *
 * Runs against `dist/` (no browser, no dependencies) and fails the process when
 * something that Search Console cares about is broken. Intended to run in CI
 * between `astro build` and the Pages upload.
 *
 *   node scripts/verify-seo.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SITE = 'https://mendiak.github.io';
const BASE = '/pulse.roots';

const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walkHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Map an absolute site path (e.g. /pulse.roots/genres/techno/) to a file in dist. */
function fileForUrl(urlPath) {
  const rel = urlPath.replace(/^\/pulse\.roots\/?/, '').replace(/^\//, '');
  if (rel === '') return path.join(DIST, 'index.html');
  if (rel.endsWith('/')) return path.join(DIST, rel, 'index.html');
  return path.join(DIST, rel);
}

function pageUrl(file) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.slice(0, -'index.html'.length)}`;
  return `${BASE}/${rel}`;
}

const htmlFiles = walkHtml(DIST);

const robotsMeta = page => page.html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';

const pages = htmlFiles.map(file => {
  const html = fs.readFileSync(file, 'utf-8');
  return {
    file,
    html,
    url: pageUrl(file),
    isRedirect: /<meta[^>]+http-equiv=["']?refresh/i.test(html),
  };
});

const indexable = pages.filter(page =>
  !page.isRedirect &&
  !page.url.endsWith('404.html') &&
  !robotsMeta(page).includes('noindex')
);

/* -------------------------------------------------------------- redirects */
for (const page of pages.filter(p => p.isRedirect)) {
  const target = page.html.match(/url=([^">\s]+)/)?.[1];
  if (!target) {
    fail(`${page.url} redirect has no target`);
    continue;
  }

  let localTarget = target;
  if (/^https?:\/\//.test(localTarget)) {
    if (!localTarget.startsWith(SITE)) {
      fail(`${page.url} redirects outside the site: ${target}`);
      continue;
    }
    localTarget = localTarget.slice(SITE.length);
  }

  if (!localTarget.startsWith(`${BASE}/`)) {
    fail(`${page.url} redirects outside the site path: ${target} (missing ${BASE})`);
  } else if (!fs.existsSync(fileForUrl(localTarget))) {
    fail(`${page.url} redirects to a missing page: ${target}`);
  }
}

/* ---------------------------------------------------------------- sitemap */
const sitemapFile = path.join(DIST, 'sitemap-0.xml');
const sitemapIndexFile = path.join(DIST, 'sitemap-index.xml');

if (!fs.existsSync(sitemapIndexFile)) fail('sitemap-index.xml is missing');
if (!fs.existsSync(sitemapFile)) {
  fail('sitemap-0.xml is missing');
} else {
  const xml = fs.readFileSync(sitemapFile, 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const seen = new Set();

  if (locs.length === 0) fail('sitemap-0.xml has no <loc> entries');

  for (const loc of locs) {
    if (seen.has(loc)) fail(`sitemap has a duplicate URL: ${loc}`);
    seen.add(loc);

    if (!loc.startsWith(`${SITE}${BASE}/`)) {
      fail(`sitemap URL is outside the site path: ${loc}`);
      continue;
    }
    const localPath = loc.slice(SITE.length);
    if (!fs.existsSync(fileForUrl(localPath))) {
      fail(`sitemap URL has no built page: ${loc}`);
    }
  }

  for (const loc of [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1])) {
    if (Number.isNaN(Date.parse(loc))) fail(`invalid <lastmod>: ${loc}`);
    else if (Date.parse(loc) > Date.now() + 86_400_000) fail(`<lastmod> is in the future: ${loc}`);
  }

  for (const page of indexable) {
    if (!seen.has(`${SITE}${page.url}`)) {
      fail(`indexable page missing from sitemap: ${page.url}`);
    }
  }
}

/* ------------------------------------------------------------------ links */
const brokenLinks = new Map();
for (const page of pages) {
  const hrefs = [...page.html.matchAll(/href="(\/pulse\.roots[^"#?]*)/g)].map(m => m[1]);
  for (const href of new Set(hrefs)) {
    if (!fs.existsSync(fileForUrl(href))) {
      brokenLinks.set(href, (brokenLinks.get(href) || 0) + 1);
    }
  }
  if (/href="[^"]*\/genres\/[^"]*\.html"/.test(page.html)) {
    fail(`${page.url} links to a legacy .html genre URL`);
  }
  if (page.html.includes('/pulse.roots/es/genres/')) {
    fail(`${page.url} links to a removed /es/genres/ redirect`);
  }
}
for (const [href, count] of brokenLinks) {
  fail(`broken internal link (${count}x): ${href}`);
}

/* --------------------------------------------------------------- metadata */
const titles = new Map();
const descriptions = new Map();
const titlePattern = /<title>([^<]*)<\/title>/;
const descPattern = /<meta name="description" content="([^"]*)"/;

for (const page of indexable) {
  const title = page.html.match(titlePattern)?.[1] ?? '';
  const description = page.html.match(descPattern)?.[1] ?? '';

  if (!title) fail(`${page.url} has no <title>`);
  if (title.length > 70) fail(`${page.url} title is too long (${title.length} chars)`);
  if (title.length < 15) warn(`${page.url} title is very short (${title.length} chars)`);

  const titleKey = title.toLowerCase();
  if (titles.has(titleKey)) fail(`duplicate title: "${title}" (${page.url} and ${titles.get(titleKey)})`);
  else titles.set(titleKey, page.url);

  if (!description) fail(`${page.url} has no meta description`);
  else if (description.length > 165) fail(`${page.url} meta description is too long (${description.length} chars)`);

  const descKey = description.toLowerCase();
  if (descriptions.has(descKey)) {
    fail(`duplicate meta description (${page.url} and ${descriptions.get(descKey)})`);
  } else {
    descriptions.set(descKey, page.url);
  }

  const h1Count = (page.html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) fail(`${page.url} has ${h1Count} <h1> elements (expected 1)`);

  const canonical = page.html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const expectedCanonical = `${SITE}${page.url}`;
  if (!canonical) fail(`${page.url} has no canonical`);
  else if (canonical !== expectedCanonical) {
    fail(`${page.url} canonical mismatch: ${canonical} (expected ${expectedCanonical})`);
  }

  if (!/hreflang="x-default"/.test(page.html)) warn(`${page.url} has no hreflang="x-default"`);
}

/* --------------------------------------------------------------- hreflang */
const pagesByUrl = new Map(pages.map(page => [page.url, page]));

function alternateLinks(html) {
  return [...html.matchAll(/<link\b[^>]*rel="alternate"[^>]*>/g)]
    .map(match => match[0])
    .map(tag => ({
      hreflang: tag.match(/hreflang="([^"]+)"/)?.[1],
      href: tag.match(/href="([^"]+)"/)?.[1],
    }))
    .filter(link => link.hreflang && link.href);
}

for (const page of indexable) {
  const links = alternateLinks(page.html);
  const langs = new Set(links.map(link => link.hreflang));
  const absoluteUrl = `${SITE}${page.url}`;

  if (!langs.has('x-default')) fail(`${page.url} has no hreflang="x-default"`);
  if (!langs.has('en')) fail(`${page.url} has no hreflang="en"`);

  for (const link of links) {
    if (!link.href.startsWith(`${SITE}${BASE}/`)) {
      fail(`${page.url} hreflang="${link.hreflang}" points outside the site: ${link.href}`);
      continue;
    }

    const targetPath = link.href.slice(SITE.length);
    const target = pagesByUrl.get(targetPath);
    if (!target || (target.isRedirect && link.hreflang !== 'x-default')) {
      fail(`${page.url} hreflang="${link.hreflang}" points to a missing page: ${link.href}`);
      continue;
    }
    if (target.isRedirect) continue;

    const backLinks = alternateLinks(target.html).map(item => item.href);
    if (!backLinks.includes(absoluteUrl)) {
      fail(`${page.url} hreflang="${link.hreflang}" is not reciprocal (${link.href} does not link back)`);
    }
  }
}

/* ------------------------------------------------------------- social image */
for (const page of indexable) {
  const image = page.html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  const imageAlt = page.html.match(/<meta property="og:image:alt" content="([^"]*)"/)?.[1];
  const imageType = page.html.match(/<meta property="og:image:type" content="([^"]*)"/)?.[1];

  if (!image) {
    fail(`${page.url} has no og:image`);
    continue;
  }
  if (!imageAlt) fail(`${page.url} has no og:image:alt`);

  if (image.startsWith(`${SITE}${BASE}/`)) {
    const local = path.join(DIST, image.slice(`${SITE}${BASE}/`.length));
    if (!fs.existsSync(local)) fail(`${page.url} og:image does not exist: ${image}`);
    if (/\.webp$/i.test(image)) {
      warn(`${page.url} og:image is WebP; LinkedIn/Facebook may not render it`);
    }
    if (imageType === 'image/webp') {
      warn(`${page.url} og:image:type is WebP`);
    }
  }
}

/* ------------------------------------------------------ structured data per type */
for (const page of indexable) {
  if (!/\/genres\/[^/]+\//.test(page.url)) continue;
  if (!/"@type":"MusicGenre"/.test(page.html)) {
    fail(`${page.url} is missing MusicGenre structured data`);
  }
}

/* ------------------------------------------------------- robots & 404 page */
const expectedNoindex = page =>
  page.isRedirect || page.url.includes('/thanks/') || page.url.endsWith('404.html');

for (const page of pages) {
  const hasNoindex = robotsMeta(page).includes('noindex');
  if (hasNoindex && !expectedNoindex(page)) {
    fail(`unexpected noindex on ${page.url}`);
  }
  if (!hasNoindex && !page.isRedirect &&
      (page.url.includes('/thanks/') || page.url.endsWith('404.html'))) {
    fail(`${page.url} should be noindex`);
  }
}

const notFound = path.join(DIST, '404.html');
if (!fs.existsSync(notFound)) fail('404.html is missing');
else if (!robotsMeta({ html: fs.readFileSync(notFound, 'utf-8') }).includes('noindex')) {
  fail('404.html should be noindex');
}

const robotsTxt = path.join(DIST, 'robots.txt');
if (!fs.existsSync(robotsTxt)) {
  fail('robots.txt is missing');
} else {
  const txt = fs.readFileSync(robotsTxt, 'utf-8');
  if (!txt.includes(`Sitemap: ${SITE}${BASE}/sitemap-index.xml`)) {
    fail('robots.txt does not reference sitemap-index.xml');
  }
  if (!/Disallow:\s*\/pulse\.roots\/thanks\//.test(txt)) {
    fail('robots.txt does not disallow /thanks/');
  }
}

/* ------------------------------------------------------------ structured data */
for (const page of pages) {
  const blocks = [...page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      fail(`${page.url} has invalid JSON-LD`);
      continue;
    }
    const graphs = data['@graph'] ? data['@graph'] : [data];
    for (const node of graphs) {
      if (node['@type'] !== 'BreadcrumbList') continue;
      const items = node.itemListElement || [];
      items.forEach((item, i) => {
        if (item.position !== i + 1) {
          fail(`${page.url} BreadcrumbList position ${item.position} at index ${i} (expected ${i + 1})`);
        }
      });
    }
  }
}

/* ------------------------------------------------------------------ report */
const label = `${pages.length} HTML files (${indexable.length} indexable, ${pages.length - indexable.length} redirects/noindex)`;

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   - ${w}`);
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s) in ${label}:\n`);
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}

console.log(`\n✅ SEO checks passed — ${label}`);
