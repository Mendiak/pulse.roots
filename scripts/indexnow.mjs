/**
 * Push URLs to IndexNow (Bing, Yandex, Seznam and other participants).
 *
 *   node scripts/indexnow.mjs          -> submits the home page and the HTML sitemap
 *   node scripts/indexnow.mjs --all    -> submits every URL in dist/sitemap-0.xml
 *
 * The key file lives in public/ so it is published with the site, which is how
 * search engines verify that the submitter controls the host.
 */

import fs from 'node:fs';
import path from 'node:path';

const KEY = 'cfc667e375c686b4c0e43080bf84c516';
const HOST = 'mendiak.github.io';
const SITE = `https://${HOST}/pulse.roots`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const submitAll = process.argv.includes('--all');
const sitemapPath = path.resolve('dist/sitemap-0.xml');

let urls;

if (submitAll) {
  if (!fs.existsSync(sitemapPath)) {
    console.error('dist/sitemap-0.xml not found. Run `npm run build` first.');
    process.exit(1);
  }
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
} else {
  urls = [`${SITE}/`, `${SITE}/sitemap/`];
}

if (urls.length === 0) {
  console.error('No URLs to submit.');
  process.exit(1);
}

// IndexNow accepts up to 10,000 URLs per request.
const batches = [];
for (let i = 0; i < urls.length; i += 10_000) {
  batches.push(urls.slice(i, i + 10_000));
}

console.log(`Submitting ${urls.length} URL(s) to IndexNow...`);

for (const urlList of batches) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList,
    }),
  });

  const body = await response.text();
  console.log(`  -> HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);

  if (!response.ok) {
    // 403 = invalid key, 422 = URLs outside the host, 429 = rate limited.
    process.exitCode = 1;
  }
}
