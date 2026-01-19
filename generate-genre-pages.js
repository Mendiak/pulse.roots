const fs = require('fs');
const path = require('path');

const genresFilePath = path.join(__dirname, 'pulseroots.genres.json');
const templatePath = path.join(__dirname, 'index.html');
const outputDir = path.join(__dirname, 'genres');
const baseUrl = 'https://mendiak.github.io/pulse.roots'; // Corrected base URL
const BASE_REPLACEMENT = '/pulse.roots';

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

// Helper function to recursively get all genres from the JSON structure, including their full slug path
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

try {
    // 1. Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true }); // Ensure recursive
        console.log(`Created directory: ${outputDir}`);
    }

    // 2. Read the template and genre data
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    const genresData = JSON.parse(fs.readFileSync(genresFilePath, 'utf-8'));

    // 3. Get a flat list of all genre names with their full hierarchical slugs
    const allGenresWithSlugs = getAllGenres(genresData);
    let generatedCount = 0;

    console.log(`Found ${allGenresWithSlugs.length} genres. Starting generation...`);

    // 4. Generate a page for each genre
    allGenresWithSlugs.forEach(genreInfo => {
        const { genreName, fullSlugPath } = genreInfo;
        const slugFileName = path.basename(fullSlugPath); // Get only the last part for the filename
        
        const genreOutputDir = path.join(outputDir, path.dirname(fullSlugPath));
        if (!fs.existsSync(genreOutputDir)) {
            fs.mkdirSync(genreOutputDir, { recursive: true });
        }

        const newFilePath = path.join(genreOutputDir, `${slugFileName}.html`);
        let newHtml = templateHtml;

        // Make all asset paths root-relative
        newHtml = newHtml.replace(/href="styles\.css"/, `href="${BASE_REPLACEMENT}/styles.css"`);
        newHtml = newHtml.replace(/src="script\.js"/, `src="${BASE_REPLACEMENT}/script.js"`);
        newHtml = newHtml.replace(/src="assets\/logo\.png"/, `src="${BASE_REPLACEMENT}/assets/logo.png"`);
        newHtml = newHtml.replace(/src="assets\/footer-logo\.png"/, `src="${BASE_REPLACEMENT}/assets/footer-logo.png"`);
        newHtml = newHtml.replace(/rel="icon" href="assets\/favicon\.png"/, `rel="icon" href="${BASE_REPLACEMENT}/assets/favicon.png"`);
        newHtml = newHtml.replace(/href="index\.html"/g, `href="${BASE_REPLACEMENT}/index.html"`);
        newHtml = newHtml.replace(/href="contact\.html"/g, `href="${BASE_REPLACEMENT}/contact.html"`);
        newHtml = newHtml.replace(/href="privacy\.html"/g, `href="${BASE_REPLACEMENT}/privacy.html"`);
        newHtml = newHtml.replace(/content="https:\/\/mendiak\.github.io\/pulse\.roots\/assets\/og_image\.webp"/, `content="${baseUrl}/assets/og_image.webp"`);

        // Update title
        const newTitle = `PulseRoots: ${genreName}`;
        newHtml = newHtml.replace(/<title>.*<\/title>/, `<title>${newTitle}</title>`);
        newHtml = newHtml.replace(/<meta property="og:title" content=".*">/, `<meta property="og:title" content="${newTitle}">`);
        newHtml = newHtml.replace(/<meta name="twitter:title" content=".*">/, `<meta name="twitter:title" content="${newTitle}">`);

        // Update canonical and social URLs
        const newUrl = `${baseUrl}/genres/${fullSlugPath}.html`;
        newHtml = newHtml.replace(/<link rel="canonical" href=".*">/, `<link rel="canonical" href="${newUrl}">`);
        newHtml = newHtml.replace(/<meta property="og:url" content=".*">/, `<meta property="og:url" content="${newUrl}">`);
        
        // Update social sharing links to use the new URL
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

        // Inject script to specify which genre to load, using JSON.stringify for safe escaping
        const scriptToInject = `
    <script>
        window.PR_GENRE_TO_LOAD = ${JSON.stringify(genreName)};
    </script>
</body>`;
        newHtml = newHtml.replace('</body>', scriptToInject);

        // Write the new file
        fs.writeFileSync(newFilePath, newHtml, 'utf-8');
        generatedCount++;
    });

    console.log(`Successfully generated ${generatedCount} genre pages in '${outputDir}'.`);

} catch (error) {
    console.error('An error occurred during page generation:', error);
    process.exit(1);
}
