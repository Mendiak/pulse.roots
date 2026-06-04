const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    genresFilePath: path.join(__dirname, 'data', 'pulseroots.genres.json'),
    templatePath: path.join(__dirname, 'index.html'),
    outputDir: path.join(__dirname, 'genres'),
    sitemapPath: path.join(__dirname, 'sitemap.xml'),
    sitemapHtmlPath: path.join(__dirname, 'sitemap.html'),
    baseUrl: 'https://mendiak.github.io/pulse.roots',
    baseReplacement: '/pulse.roots'
};

/**
 * Helper function to create a URL-friendly slug
 */
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/\//g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Truncate text to approximately maxLen characters, breaking at word boundary
 */
function truncateText(text, maxLen) {
    if (!text || text.length <= maxLen) return text || '';
    const truncated = text.substring(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Escape HTML special characters in text
 */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Get genre depth from its path (1 = top-level)
 */
function getGenreDepth(fullSlugPath) {
    return fullSlugPath.split('/').length;
}

/**
 * Build BreadcrumbList JSON-LD structured data
 */
function buildBreadcrumbLd(breadcrumbs, currentGenreName, baseUrl, fullSlugPath) {
    const items = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl + "/"
        }
    ];

    let pos = 2;
    for (const crumb of breadcrumbs) {
        items.push({
            "@type": "ListItem",
            "position": pos++,
            "name": crumb.name,
            "item": `${baseUrl}/${crumb.url}`
        });
    }

    items.push({
        "@type": "ListItem",
        "position": pos,
        "name": currentGenreName,
        "item": `${baseUrl}/genres/${fullSlugPath}.html`
    });

    return `<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items }, null, 2)}
</script>`;
}

/**
 * Build link rel tags for crawl navigation
 */
function buildLinkRelTags(baseUrl, fullSlugPath, breadcrumbs) {
    const indexTag = `    <link rel="index" href="${baseUrl}/">\n`;
    if (breadcrumbs.length > 0) {
        const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
        return indexTag + `    <link rel="up" href="${baseUrl}/${lastCrumb.url}">\n`;
    }
    return indexTag;
}

/**
 * Build MusicGenre + WebPage JSON-LD structured data for a genre page
 */
function buildMusicGenreLd(genreName, description, baseUrl, fullSlugPath, wikipediaUrl) {
    const url = `${baseUrl}/genres/${fullSlugPath}.html`;
    const desc = description || `Explore the ${genreName} style in electronic music on PulseRoots.`;

    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `PulseRoots: ${genreName}`,
        "description": desc,
        "url": url,
        "about": {
            "@type": "MusicGenre",
            "name": genreName
        }
    };

    let result = `<script type="application/ld+json">\n${JSON.stringify(webPageSchema, null, 2)}\n</script>\n`;

    return result;
}

/**
 * Generate HTML tree of all genres for the footer
 */
function generateGenreTreeHtml(allGenreInfos, relativePrefix = '') {
    const childrenMap = {};
    for (const info of allGenreInfos) {
        const parts = info.fullSlugPath.split('/');
        const parentKey = parts.slice(0, -1).join('/');
        if (!childrenMap[parentKey]) {
            childrenMap[parentKey] = [];
        }
        childrenMap[parentKey].push(info);
    }

    for (const key of Object.keys(childrenMap)) {
        childrenMap[key].sort((a, b) => a.genreName.localeCompare(b.genreName));
    }

    function buildNestedList(parentKey) {
        const children = childrenMap[parentKey];
        if (!children || children.length === 0) return '';

        let html = '        <ul>\n';
        for (const child of children) {
            const url = `${relativePrefix}genres/${child.fullSlugPath}.html`;
            const grandChildren = childrenMap[child.fullSlugPath];

            if (grandChildren && grandChildren.length > 0) {
                html += `          <li>\n`;
                html += `            <details>\n`;
                html += `              <summary><a href="${url}">${escapeHtml(child.genreName)}</a></summary>\n`;
                html += buildNestedList(child.fullSlugPath);
                html += `            </details>\n`;
                html += `          </li>\n`;
            } else {
                html += `          <li><a href="${url}">${escapeHtml(child.genreName)}</a></li>\n`;
            }
        }
        html += '        </ul>\n';
        return html;
    }

    const topLevel = childrenMap[''] || [];
    topLevel.sort((a, b) => a.genreName.localeCompare(b.genreName));

    let html = '';
    for (const top of topLevel) {
        const url = `${relativePrefix}genres/${top.fullSlugPath}.html`;
        html += `      <details>\n        <summary><a href="${url}">${escapeHtml(top.genreName)}</a></summary>\n`;
        html += buildNestedList(top.fullSlugPath);
        html += `      </details>\n`;
    }
    return html;
}

/**
 * Recursively get all genres from the JSON structure with full hierarchical info
 */
function getAllGenres(genres) {
    let allGenres = [];

    const traverse = (items, currentSlugPathParts, breadcrumbs) => {
        for (const item of items) {
            const genreName = item.name || item.style;
            if (!genreName) continue;

            const currentSlug = slugify(genreName);
            const fullSlugPath = currentSlugPathParts.length > 0
                ? [...currentSlugPathParts, currentSlug].join('/')
                : currentSlug;

            const children = [];
            if (item.substyles && item.substyles.length > 0) {
                for (const child of item.substyles) {
                    const childName = child.name || child.style;
                    if (childName) {
                        const childSlug = slugify(childName);
                        children.push({
                            name: childName,
                            url: `genres/${fullSlugPath}/${childSlug}.html`
                        });
                    }
                }
            }

            allGenres.push({
                genreName,
                fullSlugPath,
                breadcrumbs: [...breadcrumbs],
                children,
                description: item.description || '',
                wikipediaUrl: item.wikipedia_url || '',
                spotifyTrackId: item.spotify_track_id || '',
                exampleTrack: item.example || ''
            });

            if (item.substyles && item.substyles.length > 0) {
                const childBreadcrumbs = [
                    ...breadcrumbs,
                    { name: genreName, url: `genres/${fullSlugPath}.html` }
                ];
                traverse(item.substyles, [...currentSlugPathParts, currentSlug], childBreadcrumbs);
            }
        }
    };

    traverse(genres, [], []);
    return allGenres;
}

/**
 * Build breadcrumb HTML string for a genre
 */
function buildBreadcrumbHtml(breadcrumbs, currentGenreName, relativePrefix) {
    let html = '<nav id="breadcrumbs" aria-label="Breadcrumb">\n';
    html += `    <a href="${relativePrefix}index.html">Home</a>\n`;
    for (const crumb of breadcrumbs) {
        html += `    <span class="breadcrumb-sep">›</span> <a href="${relativePrefix}${crumb.url}">${crumb.name}</a>\n`;
    }
    html += `    <span class="breadcrumb-sep">›</span> <span class="breadcrumb-current">${currentGenreName}</span>\n`;
    html += '  </nav>';
    return html;
}

/**
 * Build subgenre links HTML string
 */
function buildSubgenreHtml(children, relativePrefix) {
    if (!children || children.length === 0) return '';
    let html = `  <div id="subgenre-links">\n    <h3>Subgenres</h3>\n    <ul>\n`;
    for (const child of children) {
        html += `      <li><a href="${relativePrefix}${child.url}">${child.name}</a></li>\n`;
    }
    html += `    </ul>\n  </div>`;
    return html;
}

/**
 * Generate individual HTML pages for each genre
 */
function generateGenrePages(allGenresWithSlugs, templateHtml) {
    console.log(`Generating ${allGenresWithSlugs.length} genre pages...`);
    let generatedCount = 0;

    allGenresWithSlugs.forEach(genreInfo => {
        const { genreName, fullSlugPath, breadcrumbs, children, description, wikipediaUrl } = genreInfo;
        const slugFileName = path.basename(fullSlugPath);

        const genreOutputDir = path.join(CONFIG.outputDir, path.dirname(fullSlugPath));
        if (!fs.existsSync(genreOutputDir)) {
            fs.mkdirSync(genreOutputDir, { recursive: true });
        }

        const newFilePath = path.join(genreOutputDir, `${slugFileName}.html`);
        let newHtml = templateHtml;

        // Calculate relative path prefix based on genre depth
        const depth = fullSlugPath.split('/').length;
        const relativePrefix = depth > 0 ? '../'.repeat(depth) : './';

        // Make all asset paths relative (works in both local dev and GitHub Pages)
        newHtml = newHtml.replace(/href="styles\.css"/, `href="${relativePrefix}styles.css"`);
        newHtml = newHtml.replace(/src="src\/js\/main\.js"/, `src="${relativePrefix}src/js/main.js"`);
        newHtml = newHtml.replace(/src="src\/js\/cookie-consent\.js"/, `src="${relativePrefix}src/js/cookie-consent.js"`);
        newHtml = newHtml.replace(/src="assets\/logo\.png"/, `src="${relativePrefix}assets/logo.png"`);
        newHtml = newHtml.replace(/src="assets\/footer-logo\.png"/, `src="${relativePrefix}assets/footer-logo.png"`);
        newHtml = newHtml.replace(/rel="icon" href="assets\/favicon\.png"/, `rel="icon" href="${relativePrefix}assets/favicon.png"`);
        newHtml = newHtml.replace(/href="index\.html"/g, `href="${relativePrefix}index.html"`);
        newHtml = newHtml.replace(/href="contact\.html"/g, `href="${relativePrefix}contact.html"`);
        newHtml = newHtml.replace(/href="privacy\.html"/g, `href="${relativePrefix}privacy.html"`);
        newHtml = newHtml.replace(/href="genres\//g, `href="${relativePrefix}genres/`);
        newHtml = newHtml.replace(/<link rel=\"sitemap\" type=\"application\/xml\" title=\"Sitemap\" href=\".*\">/, `<link rel="sitemap" type="application/xml" title="Sitemap" href="${CONFIG.baseUrl}/sitemap.xml">`);
        newHtml = newHtml.replace(/content="https:\/\/mendiak\.github.io\/pulse\.roots\/assets\/og_image\.webp"/, `content="${CONFIG.baseUrl}/assets/og_image.webp"`);

        // Update title and H1
        const newTitle = `PulseRoots: ${genreName}`;
        newHtml = newHtml.replace(/<title>.*<\/title>/, `<title>${newTitle}</title>`);
        newHtml = newHtml.replace(/<meta property="og:title" content=".*">/, `<meta property="og:title" content="${newTitle}">`);
        newHtml = newHtml.replace(/<meta name="twitter:title" content=".*">/, `<meta name="twitter:title" content="${newTitle}">`);
        newHtml = newHtml.replace(/(<h1>).*?(<\/h1>)/, `$1${genreName}$2`);

        // Generate unique meta description from genre description
        const metaDesc = truncateText(description, 155) || `Explore the ${genreName} style in electronic music on PulseRoots. Discover its history, key artists, and sample tracks in our interactive visualization.`;
        const metaDescEscaped = metaDesc.replace(/"/g, '&quot;');
        newHtml = newHtml.replace(
            /<meta name="description"[\s\S]*?>/,
            `<meta name="description" content="${metaDescEscaped}">`
        );
        newHtml = newHtml.replace(
            /<meta property="og:description"[\s\S]*?>/,
            `<meta property="og:description" content="${metaDescEscaped}">`
        );
        newHtml = newHtml.replace(
            /<meta name="twitter:description"[\s\S]*?>/,
            `<meta name="twitter:description" content="${metaDescEscaped}">`
        );

        // Update canonical and social URLs
        const newUrl = `${CONFIG.baseUrl}/genres/${fullSlugPath}.html`;
        newHtml = newHtml.replace(/<link rel="canonical" href=".*">/, `<link rel="canonical" href="${newUrl}">`);
        newHtml = newHtml.replace(/<meta property="og:url" content=".*">/, `<meta property="og:url" content="${newUrl}">`);

        // Update social sharing links (both footer and header popover)
        const encodedUrl = encodeURIComponent(newUrl);
        const encodedText = encodeURIComponent(`Explore ${genreName} on PulseRoots!`);
        newHtml = newHtml.replace(
            /href="https:\/\/www.facebook.com\/sharer\/sharer.php\?u=[^"]*"/g,
            `href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"`
        );
        newHtml = newHtml.replace(
            /href="https:\/\/x.com\/intent\/tweet\?url=[^"]*"/g,
            `href="https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}"`
        );
        newHtml = newHtml.replace(
            /href="https:\/\/www.reddit.com\/submit\?url=[^"]*"/g,
            `href="https://www.reddit.com/submit?url=${encodedUrl}&title=${newTitle}"`
        );

        // Inject BreadcrumbList + MusicGenre/WebPage JSON-LD + link rel tags for crawler navigation
        const breadcrumbLd = buildBreadcrumbLd(breadcrumbs, genreName, CONFIG.baseUrl, fullSlugPath);
        const musicLd = buildMusicGenreLd(genreName, description, CONFIG.baseUrl, fullSlugPath, wikipediaUrl);
        const linkRelTags = buildLinkRelTags(CONFIG.baseUrl, fullSlugPath, breadcrumbs);
        newHtml = newHtml.replace('</head>', `${breadcrumbLd}\n${musicLd}\n${linkRelTags}\n</head>`);

        // Inject subgenre links before </footer (full tree already in nav#footer-genres)
        const subgenreHtml = buildSubgenreHtml(children, relativePrefix);
        if (subgenreHtml) {
            newHtml = newHtml.replace('</footer>', `${subgenreHtml}\n  </footer>`);
        }

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

    const urls = [
        { loc: baseUrlWithSlash, lastmod: today, changefreq: 'monthly', priority: '1.0' },
        { loc: `${baseUrlWithSlash}contact.html`, lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: `${baseUrlWithSlash}privacy.html`, lastmod: today, changefreq: 'yearly', priority: '0.7' },
        { loc: `${baseUrlWithSlash}sitemap.html`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
    ];

    allGenreInfos.forEach(genreInfo => {
        if (genreInfo.fullSlugPath) {
            const depth = getGenreDepth(genreInfo.fullSlugPath);
            let priority;
            if (depth === 1) priority = '0.9';
            else if (depth === 2) priority = '0.8';
            else if (depth === 3) priority = '0.7';
            else priority = '0.6';

            urls.push({
                loc: `${baseUrlWithSlash}genres/${genreInfo.fullSlugPath}.html`,
                lastmod: today,
                changefreq: 'monthly',
                priority: priority,
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

/**
 * Generate an HTML sitemap page with crawlable links to all pages
 */
function generateSitemapHtml(allGenreInfos) {
    console.log("Generating sitemap.html...");

    const baseUrl = CONFIG.baseUrl;

    let genreTreeHtml = '';

    // Build a tree structure grouped by top-level genre
    const topLevel = {};
    for (const info of allGenreInfos) {
        const parts = info.fullSlugPath.split('/');
        const top = parts[0];
        if (!topLevel[top]) {
            topLevel[top] = { name: info.genreName, items: [] };
        }
        if (parts.length === 1) {
            topLevel[top].name = info.genreName;
        }
        topLevel[top].items.push(info);
    }

    // Build nested HTML list from the flat list using slug prefix matching
    function buildNestedList(infos, baseUrl) {
        let html = '<ul>\n';
        for (const info of infos) {
            const url = `${baseUrl}/genres/${info.fullSlugPath}.html`;
            // Find children of this node
            const prefix = info.fullSlugPath + '/';
            const children = infos.filter(i => i.fullSlugPath.startsWith(prefix) && i.fullSlugPath !== info.fullSlugPath && i.fullSlugPath.split('/').length === info.fullSlugPath.split('/').length + 1);
            html += `      <li><a href="${url}">${info.genreName}</a>`;
            if (children.length > 0) {
                html += '\n' + buildNestedList(children, baseUrl);
            }
            html += '</li>\n';
        }
        html += '    </ul>\n';
        return html;
    }

    // Build flat link list for simplicity and reliability
    let linkHtml = '';
    for (const info of allGenreInfos) {
        const url = `${baseUrl}/genres/${info.fullSlugPath}.html`;
        const indent = info.fullSlugPath.split('/').length;
        linkHtml += `${'  '.repeat(indent)}<li><a href="${url}">${info.genreName}</a></li>\n`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitemap - PulseRoots</title>
  <meta name="robots" content="index, follow">
  <meta name="description" content="Sitemap of PulseRoots - an interactive visualization of electronic music genres. Browse all available genre pages.">
  <link rel="canonical" href="${baseUrl}/sitemap.html">
  <link rel="stylesheet" href="${CONFIG.baseReplacement}/styles.css">
  <link rel="icon" href="${CONFIG.baseReplacement}/assets/favicon.png" type="image/x-icon">
</head>
<body>
  <header>
    <div id="header-container">
      <a href="${CONFIG.baseReplacement}/" id="logo-link" aria-label="Home">
        <h1>PulseRoots - Sitemap</h1>
      </a>
    </div>
  </header>
  <main>
    <div id="main-container" style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <h2>All Pages</h2>
      <ul>
        <li><a href="${baseUrl}/">Home</a></li>
        <li><a href="${baseUrl}/contact.html">Contact</a></li>
        <li><a href="${baseUrl}/privacy.html">Privacy Policy</a></li>
        <li><a href="${baseUrl}/thanks.html">Thanks</a></li>
      </ul>
      <h2>All Genres</h2>
      <ul>
${linkHtml}
      </ul>
    </div>
  </main>
  <footer>
    <div class="footer-bottom">
      <p>&copy; <span id="current-year"></span> PulseRoots. Mapping the pulse of electronic music.</p>
    </div>
  </footer>
</body>
</html>`;

    fs.writeFileSync(CONFIG.sitemapHtmlPath, html, 'utf-8');
    console.log(`✓ HTML Sitemap generated successfully.`);
}

/**
 * Generate genres/index.html with crawlable links to all genre pages
 */
function generateGenresIndexPage(allGenreInfos) {
    console.log("Generating genres/index.html...");

    const baseUrl = CONFIG.baseUrl;
    const relativePrefix = '../';

    let linkHtml = '';
    for (const info of allGenreInfos) {
        const url = `${baseUrl}/genres/${info.fullSlugPath}.html`;
        const indent = getGenreDepth(info.fullSlugPath);
        linkHtml += `${'  '.repeat(indent)}<li><a href="${url}">${escapeHtml(info.genreName)}</a></li>\n`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Genres - PulseRoots</title>
  <meta name="robots" content="index, follow">
  <meta name="description" content="Browse all electronic music genres on PulseRoots - from Techno and House to Ambient and Experimental.">
  <link rel="canonical" href="${baseUrl}/genres/">
  <link rel="stylesheet" href="${relativePrefix}styles.css">
  <link rel="icon" href="${relativePrefix}assets/favicon.png" type="image/x-icon">
</head>
<body>
  <header>
    <div id="header-container">
      <a href="${baseUrl}/" id="logo-link" aria-label="Home">
        <h1>PulseRoots - All Genres</h1>
      </a>
    </div>
  </header>
  <main>
    <div id="main-container" style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <h2>All Genres</h2>
      <ul>
        <li><a href="${baseUrl}/">Home</a></li>
      </ul>
      <h3>Genre Pages</h3>
      <ul>
${linkHtml}
      </ul>
    </div>
  </main>
  <footer>
    <div class="footer-bottom">
      <p>&copy; <span id="current-year"></span> PulseRoots. Mapping the pulse of electronic music.</p>
    </div>
  </footer>
</body>
</html>`;

    const indexPath = path.join(CONFIG.outputDir, 'index.html');
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log(`✓ genres/index.html generated with ${allGenreInfos.length} genre links.`);
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
    generateSitemapHtml(allGenresWithSlugs);
    generateGenresIndexPage(allGenresWithSlugs);

    // Inject full genre tree into index.html footer
    console.log("Updating index.html with full genre tree...");
    const indexHtml = fs.readFileSync(CONFIG.templatePath, 'utf-8');
    const genreTreeHtml = generateGenreTreeHtml(allGenresWithSlugs);
    const startMarker = '<!--GENRE_TREE_START-->';
    const endMarker = '<!--GENRE_TREE_END-->';
    const startIdx = indexHtml.indexOf(startMarker);
    const endIdx = indexHtml.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1) {
        const before = indexHtml.substring(0, startIdx + startMarker.length);
        const after = indexHtml.substring(endIdx);
        const updatedIndexHtml = before + '\n' + genreTreeHtml + after;
        fs.writeFileSync(CONFIG.templatePath, updatedIndexHtml, 'utf-8');
        console.log("✓ index.html updated with genre tree.");
    } else {
        console.log("⚠ Markers not found in index.html. Skipping.");
    }

    console.log('\nBuild complete!');
} catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
}
