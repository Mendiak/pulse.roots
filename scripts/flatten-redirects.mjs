/**
 * Turn Astro's legacy redirect stubs into flat `<name>.html` files.
 *
 * With `trailingSlash: 'always'` Astro writes each configured redirect as
 * `dist/genres/<name>.html/index.html`, so the historical URL
 * `/pulse.roots/genres/<name>.html` takes an extra GitHub Pages redirect to
 * `/pulse.roots/genres/<name>.html/`. Writing the file at the exact legacy path
 * keeps the old links with a single hop.
 *
 *   node scripts/flatten-redirects.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `astro build` first.');
  process.exit(1);
}

let flattened = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;

    if (entry.name.endsWith('.html')) {
      const indexFile = path.join(full, 'index.html');
      if (fs.existsSync(indexFile)) {
        const html = fs.readFileSync(indexFile, 'utf-8');
        if (/<meta[^>]+http-equiv=["']?refresh/i.test(html)) {
          const flatFile = path.join(dir, entry.name);
          fs.rmSync(full, { recursive: true, force: true });
          fs.writeFileSync(flatFile, html, 'utf-8');
          flattened++;
          continue;
        }
      }
    }

    walk(full);
  }
}

walk(DIST);
console.log(`Flattened ${flattened} legacy redirect page(s) to .html files.`);
