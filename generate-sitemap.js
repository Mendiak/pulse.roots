
const fs = require('fs');
const genres = require('./pulseroots.genres.json');

const BASE_URL = 'https://mendiak.github.io/pulse.roots/';

function generateUrls(genres, parentPath = []) {
  let urls = [];

  genres.forEach(genre => {
    const currentPathPart = (genre.name || genre.style).replace(/\s+/g, '-');
    const newPath = [...parentPath, currentPathPart];
    const styleUrl = `${BASE_URL}#${newPath.join('/')}`;
    
    urls.push({
      loc: styleUrl,
      lastmod: new Date().toISOString().split('T')[0], // Use current date for lastmod
      changefreq: 'monthly',
      priority: parentPath.length > 0 ? 0.8 : 1.0
    });

    if (genre.substyles) {
      urls = urls.concat(generateUrls(genre.substyles, newPath));
    }
  });

  return urls;
}

function generateSitemap() {
  const urls = generateUrls(genres);

  const urlset = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}contact.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}privacy.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>
  ${urlset}
</urlset>`;

  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap();
