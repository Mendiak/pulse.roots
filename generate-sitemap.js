const fs = require('fs');
const path = require('path');
const genresData = require('./pulseroots.genres.json');

const BASE_URL = 'https://mendiak.github.io/pulse.roots/';

// Helper function to create a URL-friendly slug
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/\//g, '-')            // Replace / with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Helper function to recursively get all genres from the JSON structure
function getAllGenres(genres, currentPathSlugs = []) {
    let allGenres = [];
    const traverse = (items, currentParentSlugs) => {
        for (const item of items) {
            const genreName = item.name || item.style;
            if (!genreName) continue;

            const currentGenreSlug = slugify(genreName);
            const fullGenreSlugPath = [...currentParentSlugs, currentGenreSlug].join('/');

            allGenres.push({
                genreName: genreName,
                fullSlugPath: fullGenreSlugPath
            });

            if (item.substyles && item.substyles.length > 0) {
                traverse(item.substyles, [...currentParentSlugs, currentGenreSlug]);
            }
        }
    };
    traverse(genres, currentPathSlugs);
    return allGenres;
}

function generateSitemap() {
  const allGenreInfos = getAllGenres(genresData);

  // Start with static pages
  const urls = [
    {
      loc: BASE_URL,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '1.0',
    },
    {
      loc: `${BASE_URL}contact.html`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.7',
    },
    {
      loc: `${BASE_URL}privacy.html`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.7',
    },
  ];

  // Add genre pages
  allGenreInfos.forEach(genreInfo => {
    const { genreName, fullSlugPath } = genreInfo;
    if (fullSlugPath) {
      urls.push({
        loc: `${BASE_URL}genres/${fullSlugPath}.html`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.8',
      });
    }
  });

  const urlset = urls.map(url => `  <url>
    <loc>${url.loc.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;')}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  // Write with explicit UTF-8 encoding
  fs.writeFileSync('sitemap.xml', sitemap, { encoding: 'utf8' });
  console.log('✓ Sitemap generated successfully!');
  console.log(`✓ Total URLs: ${urls.length}`);
}

generateSitemap();
