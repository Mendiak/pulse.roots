const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    genresFilePath: path.join(__dirname, 'pulseroots.genres.json'),
    templatePath: path.join(__dirname, 'index.html'),
    outputDir: path.join(__dirname, 'genres'),
    sitemapPath: path.join(__dirname, 'sitemap.xml'),
    baseUrl: 'https://mendiak.github.io/pulse.roots',
    baseReplacement: '/pulse.roots'
};

/**
 * Helper function to create a URL-friendly slug
 */
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

/**
 * Recursively get all genres from the JSON structure with their full slug path
 */
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

/**
 * Generate individual HTML pages for each genre
 */
function generateGenrePages(allGenresWithSlugs, templateHtml) {
    console.log(`Generating ${allGenresWithSlugs.length} genre pages...`);
    let generatedCount = 0;

    allGenresWithSlugs.forEach(genreInfo => {
        const { genreName, fullSlugPath } = genreInfo;
        const slugFileName = path.basename(fullSlugPath);
        
        const genreOutputDir = path.join(CONFIG.outputDir, path.dirname(fullSlugPath));
        if (!fs.existsSync(genreOutputDir)) {
            fs.mkdirSync(genreOutputDir, { recursive: true });
        }

        const newFilePath = path.join(genreOutputDir, `${slugFileName}.html`);
        let newHtml = templateHtml;

        // Make all asset paths root-relative
        newHtml = newHtml.replace(/href="styles\.css"/, `href="${CONFIG.baseReplacement}/styles.css"`);
        newHtml = newHtml.replace(/src="script\.js"/, `src="${CONFIG.baseReplacement}/script.js"`);
        newHtml = newHtml.replace(/src="assets\/logo\.png"/, `src="${CONFIG.baseReplacement}/assets/logo.png"`);
        newHtml = newHtml.replace(/src="assets\/footer-logo\.png"/, `src="${CONFIG.baseReplacement}/assets/footer-logo.png"`);
        newHtml = newHtml.replace(/rel="icon" href="assets\/favicon\.png"/, `rel="icon" href="${CONFIG.baseReplacement}/assets/favicon.png"`);
        newHtml = newHtml.replace(/href="index\.html"/g, `href="${CONFIG.baseReplacement}/index.html"`);
        newHtml = newHtml.replace(/href="contact\.html"/g, `href="${CONFIG.baseReplacement}/contact.html"`);
        newHtml = newHtml.replace(/href="privacy\.html"/g, `href="${CONFIG.baseReplacement}/privacy.html"`);
        newHtml = newHtml.replace(/<link rel=\"sitemap\" type=\"application\/xml\" title=\"Sitemap\" href=\".*\">/, `<link rel="sitemap" type="application/xml" title="Sitemap" href="${CONFIG.baseUrl}/sitemap.xml">`);
        newHtml = newHtml.replace(/content="https:\/\/mendiak\.github.io\/pulse\.roots\/assets\/og_image\.webp"/, `content="${CONFIG.baseUrl}/assets/og_image.webp"`);

        // Update title
        const newTitle = `PulseRoots: ${genreName}`;
        newHtml = newHtml.replace(/<title>.*<\/title>/, `<title>${newTitle}</title>`);
        newHtml = newHtml.replace(/<meta property="og:title" content=".*">/, `<meta property="og:title" content="${newTitle}">`);
        newHtml = newHtml.replace(/<meta name="twitter:title" content=".*">/, `<meta name="twitter:title" content="${newTitle}">`);

        // Update canonical and social URLs
        const newUrl = `${CONFIG.baseUrl}/genres/${fullSlugPath}.html`;
        newHtml = newHtml.replace(/<link rel="canonical" href=".*">/, `<link rel="canonical" href="${newUrl}">`);
        newHtml = newHtml.replace(/<meta property="og:url" content=".*">/, `<meta property="og:url" content="${newUrl}">`);
        
        // Update social sharing links
        const encodedUrl = encodeURIComponent(newUrl);
        const encodedText = encodeURIComponent(`Explore ${genreName} on PulseRoots!`);
        newHtml = newHtml.replace(
            /href="https:\/\/www.facebook.com\/sharer\/sharer.php\?u=.*"/,
            `href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"`
        );
        newHtml = newHtml.replace(
            /href="https:\/\/x.com\/intent\/tweet\?url=.*"/,
            `href="https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}"`
        );
        newHtml = newHtml.replace(
            /href="https:\/\/www.reddit.com\/submit\?url=.*"/,
            `href="https://www.reddit.com/submit?url=${encodedUrl}&title=${newTitle}"`
        );

        // Inject script for dynamic loading
        const scriptToInject = `
    <script>
        window.PR_GENRE_TO_LOAD = ${JSON.stringify(genreName)};
    </script>
</body>`;
        newHtml = newHtml.replace('</body>', scriptToInject);

        fs.writeFileSync(newFilePath, newHtml, 'utf-8');
        generatedCount++;
    });

    console.log(`✓ successfully generated ${generatedCount} genre pages.`);
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(allGenreInfos) {
    console.log("Generating sitemap.xml...");
    const today = new Date().toISOString().split('T')[0];
    const baseUrlWithSlash = CONFIG.baseUrl.endsWith('/') ? CONFIG.baseUrl : CONFIG.baseUrl + '/';

    // Start with static pages
    const urls = [
        { loc: baseUrlWithSlash, lastmod: today, changefreq: 'monthly', priority: '1.0' },
        { loc: `${baseUrlWithSlash}contact.html`, lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: `${baseUrlWithSlash}privacy.html`, lastmod: today, changefreq: 'yearly', priority: '0.7' },
    ];

    // Add genre pages
    allGenreInfos.forEach(genreInfo => {
        if (genreInfo.fullSlugPath) {
            urls.push({
                loc: `${baseUrlWithSlash}genres/${genreInfo.fullSlugPath}.html`,
                lastmod: today,
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

    fs.writeFileSync(CONFIG.sitemapPath, sitemap, 'utf-8');
    console.log(`✓ Sitemap generated successfully with ${urls.length} URLs.`);
}

// Main Execution
try {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const templateHtml = fs.readFileSync(CONFIG.templatePath, 'utf-8');
    const genresData = JSON.parse(fs.readFileSync(CONFIG.genresFilePath, 'utf-8'));
    const allGenresWithSlugs = getAllGenres(genresData);

    generateGenrePages(allGenresWithSlugs, templateHtml);
    generateSitemap(allGenresWithSlugs);

    console.log('\nBuild complete!');
} catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
}
