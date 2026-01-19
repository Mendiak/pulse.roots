/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create a color scale to be used by both the D3 tree and the mobile navigation
// It's defined globally so both functions can access it.
let colorScale = d3.scaleOrdinal(d3.schemeTableau10);

// Create a single tooltip element to be reused for performance
const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

// Function to show the tooltip
function showTooltip(event, d) {
  if (d.depth === 0) return; // Don't show tooltip for the root node

  tooltip.transition().duration(200).style('opacity', 0.9);
  tooltip.html(`
    <h3>${d.data.name}</h3>
    <p>${d.data.description || 'No description available'}</p>
    <p><i class="bi bi-hand-index"></i> Click the node to listen the example track.</p>
  `)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

// Function to hide the tooltip
function hideTooltip() {
  tooltip.transition().duration(200).style('opacity', 0);
}

// --- Reusable Panel Logic ---
// Store the element that was focused before the panel opened
let focusedElementBeforePanel;
let allGenreData; // Global variable to store all genre data
let genreMap = new Map(); // Helper to find genres and their parents
let activeSelectedNode = null; // Global state for the currently selected node in the tree
let currentLayout = 'vertical'; // Global state for the layout ('vertical' or 'radial')
let lastHighlightedNode = null; // Track the node currently being highlighted

/**
 * Creates a URL-friendly slug from a string.
 * @param {string} text The text to slugify.
 * @returns {string} The slugified text.
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
 * Recursively builds a map of genres for easy lookup and parent retrieval.
 */
function buildGenreMap(data, parent = null) {
  data.forEach(item => {
    const name = item.name || item.style;
    genreMap.set(name, { data: item, parent: parent });
    if (item.substyles && item.substyles.length > 0) {
      buildGenreMap(item.substyles, item);
    }
  });
}

function updateSchemaOrg(itemData) {
  // Remove any existing Schema.org script tags
  const existingSchema = document.getElementById('genre-schema');
  if (existingSchema) {
    existingSchema.remove();
  }

  const genreName = itemData.name || itemData.style;
  const genreDescription = itemData.description || 'An electronic music genre.';
  const genreUrl = window.location.href;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "MusicGenre",
    "name": genreName,
    "description": genreDescription,
    "url": genreUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.origin + window.location.pathname
    }
  };

  if (itemData.wikipedia_url) {
    schemaData.sameAs = itemData.wikipedia_url;
  }

  if (itemData.spotify_track_id) {
    schemaData.exampleOfWork = {
      "@type": "MusicRecording",
      "name": itemData.example || `Example track for ${genreName}`,
      "url": `https://open.spotify.com/track/${itemData.spotify_track_id}`
    };
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'genre-schema';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}

/**
 * Generates a URL-friendly path for a genre, including its parents.
 * e.g., "Parent-Genre/Child-Genre"
 * @param {Object} genreData The genre object.
 * @returns {string} The genre path.
 */
function getGenrePath(genreData) {
    const genreName = (genreData.name || genreData.style);
    const entry = genreMap.get(genreName);

    if (!entry) {
        return slugify(genreData.name || genreData.style);
    }

    let pathParts = [slugify(entry.data.name || entry.data.style)];
    let current = entry;
    while (current && current.parent) {
        const parentName = (current.parent.name || current.parent.style);
        pathParts.unshift(slugify(parentName));
        current = genreMap.get(parentName);
    }
    return pathParts.join('/');
}

function showInfoPanel(inputData, accentColor = '#ff0055') {
  // Always try to get the full data from the map to ensure we have 'substyles' and correct 'parent'
  const genreNameForLookup = inputData.name || inputData.style;
  const genreEntry = genreMap.get(genreNameForLookup);
  const itemData = genreEntry ? genreEntry.data : inputData;

  // Update Schema.org data
  updateSchemaOrg(itemData);

  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');
  const closeButton = document.getElementById('close-panel');

  // --- SEO & URL Update ---
  const genreSlug = getGenrePath(itemData);
  const newPath = `/genres/${genreSlug}.html`;
  const newUrl = `${window.location.origin}${newPath}`;
  
  // Only push state if the URL is different to avoid cluttering history
  if (window.location.pathname !== newPath) {
      history.pushState({ genre: genreNameForLookup }, '', newUrl);
  }

  // Update meta tags for the new URL
  document.querySelector('link[rel="canonical"]').setAttribute('href', newUrl);
  document.querySelector('meta[property="og:url"]').setAttribute('content', newUrl);
  const newTitle = `PulseRoots: ${itemData.name || itemData.style}`;
  document.title = newTitle;
  document.querySelector('meta[property="og:title"]').setAttribute('content', newTitle);
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', newTitle);


  // --- Accessibility: Store focus and hide background content ---
  focusedElementBeforePanel = document.activeElement;
  document.getElementById('main-container').setAttribute('aria-hidden', 'true');
  document.querySelector('header').setAttribute('aria-hidden', 'true');
  document.querySelector('footer').setAttribute('aria-hidden', 'true');

  // Show the overlay
  overlay.classList.add('visible');
  // Set the panel's accent border color
  infoPanel.style.setProperty('--panel-accent-color', accentColor);

  // --- NEW: Breadcrumbs Navigation ---
  const breadcrumbsContainer = document.createElement('div');
  breadcrumbsContainer.className = 'breadcrumbs';
  
  let currentForBreadcrumbs = genreEntry;
  const breadcrumbsPath = [];
  while (currentForBreadcrumbs) {
    breadcrumbsPath.unshift(currentForBreadcrumbs.data);
    currentForBreadcrumbs = currentForBreadcrumbs.parent ? genreMap.get(currentForBreadcrumbs.parent.name || currentForBreadcrumbs.parent.style) : null;
  }

  breadcrumbsPath.forEach((node, index) => {
    const isLast = index === breadcrumbsPath.length - 1;
    const breadcrumb = document.createElement('span');
    breadcrumb.className = isLast ? 'breadcrumb-item breadcrumb-current' : 'breadcrumb-item';
    
    const name = node.name || node.style;
    breadcrumb.innerHTML = isLast ? name : `${name} <i class="bi bi-chevron-right breadcrumb-separator"></i>`;
    
    if (!isLast) {
      breadcrumb.addEventListener('click', () => {
        showInfoPanel(node, accentColor);
      });
    }
    breadcrumbsContainer.appendChild(breadcrumb);
  });

  // Update the info panel with the node's data.
  infoContent.innerHTML = '';
  infoContent.appendChild(breadcrumbsContainer);
  
  const title = document.createElement('h2');
  title.id = 'info-panel-title';
  title.innerHTML = `<i class="bi bi-tag-fill"></i> ${itemData.name || itemData.style}`;
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'nav-link-btn share-btn';
  shareBtn.style.marginLeft = 'auto'; // Push to the right
  shareBtn.innerHTML = `<i class="bi bi-share-fill"></i> Share`;
  shareBtn.title = "Share this genre";
  shareBtn.addEventListener('click', () => {
    shareGenre(itemData);
  });
  
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'panel-header-wrapper';
  headerWrapper.style.display = 'flex';
  headerWrapper.style.alignItems = 'center';
  headerWrapper.style.marginBottom = '20px';
  headerWrapper.appendChild(title);
  headerWrapper.appendChild(shareBtn);
  
  infoContent.appendChild(headerWrapper);

  const desc = document.createElement('p');
  desc.textContent = itemData.description || 'No description available';
  infoContent.appendChild(desc);

  const example = document.createElement('p');
  example.innerHTML = `<i class="bi bi-soundwave"></i> <b>Example track: ${itemData.example || 'N/A'}</b>`;
  infoContent.appendChild(example);

  // --- Key Artists Section ---
  if (itemData.key_artists && itemData.key_artists.length > 0) {
    const artistsSection = document.createElement('div');
    artistsSection.className = 'nav-section artists-section';
    artistsSection.innerHTML = `<p class="nav-label">Key Artists:</p>`;
    
    const artistsSlider = document.createElement('div');
    artistsSlider.className = 'artists-slider';
    
    itemData.key_artists.forEach(artist => {
      const artistCard = document.createElement('a');
      artistCard.className = 'artist-card';
      artistCard.href = artist.url;
      artistCard.target = '_blank';
      artistCard.rel = 'noopener noreferrer';
      artistCard.innerHTML = `
        <span class="artist-name">${artist.name}</span>
        <i class="bi bi-spotify"></i>
      `;
      artistsSlider.appendChild(artistCard);
    });
    
    artistsSection.appendChild(artistsSlider);
    infoContent.appendChild(artistsSection);
  }

  // --- Parent Genre Navigation ---
  if (genreEntry && genreEntry.parent) {
    const parent = genreEntry.parent;
    const parentName = parent.name || parent.style;
    
    const parentNav = document.createElement('div');
    parentNav.className = 'nav-section parent-nav';
    parentNav.innerHTML = `
      <p class="nav-label">Part of:</p>
      <button class="nav-link-btn parent-link" aria-label="Go to parent genre ${parentName}">
        <i class="bi bi-arrow-up-circle"></i> ${parentName}
      </button>
    `;
    
    parentNav.querySelector('button').addEventListener('click', () => {
      showInfoPanel(parent, accentColor);
    });
    
    infoContent.appendChild(parentNav);
  }

  // --- Subgenres Navigation ---
  if (itemData.substyles && itemData.substyles.length > 0) {
    const subgenresNav = document.createElement('div');
    subgenresNav.className = 'nav-section subgenres-nav';
    subgenresNav.innerHTML = `<p class="nav-label">Subgenres:</p>`;
    
    const sublist = document.createElement('div');
    sublist.className = 'subgenres-grid';
    
    itemData.substyles.forEach(sub => {
      const subBtn = document.createElement('button');
      subBtn.className = 'nav-link-btn subgenre-link';
      subBtn.innerHTML = sub.name || sub.style;
      subBtn.addEventListener('click', () => {
        showInfoPanel(sub, accentColor);
      });
      sublist.appendChild(subBtn);
    });
    
    subgenresNav.appendChild(sublist);
    infoContent.appendChild(subgenresNav);
  }

  // --- Wikipedia Link Logic ---
  if (itemData.wikipedia_url) {
    const wikiLinkContainer = document.createElement('div');
    wikiLinkContainer.className = 'external-link-container';

    const wikiLink = document.createElement('a');
    wikiLink.href = itemData.wikipedia_url;
    wikiLink.target = '_blank';
    wikiLink.rel = 'noopener noreferrer';
    wikiLink.className = 'wikipedia-link';
    
    wikiLink.innerHTML = `<i class="bi bi-wikipedia"></i> Read more on Wikipedia`;

    wikiLinkContainer.appendChild(wikiLink);
    infoContent.appendChild(wikiLinkContainer);
  }

  const trackId = itemData.spotify_track_id;
  if (trackId) {
    spotifyEmbed.innerHTML = `
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      <p class="spotify-note"><strong>Note:</strong> Log in to Spotify in your browser to listen to the full track. Otherwise, a 30-second preview will be played.</p>
    `;
    spotifyEmbed.style.display = 'block';
  } else {
    spotifyEmbed.innerHTML = '';
    spotifyEmbed.style.display = 'none';
  }

  infoPanel.classList.add('visible');

  closeButton.classList.add('programmatic-focus');
  closeButton.focus();

  setTimeout(() => {
    closeButton.classList.remove('programmatic-focus');
  }, 150);

  const focusableElements = infoPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  infoPanel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) { 
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Saves the current expanded/collapsed state of the mobile accordion to localStorage.
 */
function saveAccordionState() {
  const expandedItems = document.querySelectorAll('#mobile-genre-list .sub-list.expanded');
  const expandedIds = Array.from(expandedItems).map(item => item.id);
  localStorage.setItem('pulseRootsAccordionState', JSON.stringify(expandedIds));
}

/**
 * Restores the accordion state from localStorage when the page loads.
 */
function restoreAccordionState() {
  const savedState = localStorage.getItem('pulseRootsAccordionState');
  if (!savedState) return;

  try {
    const expandedIds = JSON.parse(savedState);
    if (Array.isArray(expandedIds)) {
      expandedIds.forEach(id => {
        const subList = document.getElementById(id);
        const controllingButton = document.querySelector(`[aria-controls="${id}"]`);
        if (subList && controllingButton) {
          subList.classList.add('expanded');
          controllingButton.setAttribute('aria-expanded', 'true');
        }
      });
    }
  } catch (e) {
    console.error('Error parsing accordion state from localStorage:', e);
    localStorage.removeItem('pulseRootsAccordionState'); // Clear corrupted data
  }
}

/**
 * Finds a genre in the hierarchical data structure based on a URL path or name.
 * @param {string} identifier A genre name, slug, or full hierarchical slug path.
 * @returns {Object|null} The found genre object or null.
 */
function findGenre(identifier) {
    if (!identifier) return null;

    // 1. Direct lookup by name (most common)
    let entry = genreMap.get(identifier);
    if (entry) return entry.data;

    // 2. Lookup by direct slug (e.g., 'glitch' for a top-level genre)
    const slugToFind = identifier.toLowerCase();
    for (const [name, value] of genreMap.entries()) {
        if (slugify(name) === slugToFind) {
            return value.data;
        }
    }

    // 3. Lookup by full hierarchical slug path (e.g., 'experimental/sound-manipulation/glitch')
    const pathSegments = identifier.split('/');
    let currentLevel = allGenreData;
    let foundGenre = null;

    for (const segment of pathSegments) {
        const segmentName = segment.replace(/-/g, ' '); // Convert slug back to approximate name for map lookup
        // We need to find the actual data object at this level
        const nextGenre = currentLevel.find(g => slugify(g.name || g.style) === segment);

        if (nextGenre) {
            foundGenre = nextGenre;
            currentLevel = nextGenre.substyles || [];
        } else {
            return null; // Path segment not found
        }
    }
    return foundGenre;
}

// Function to fetch data from the JSON file
async function fetchData() {
  const loadingSpinner = document.getElementById('loading-spinner');
  try {
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    const response = await fetch('/pulseroots.genres.json');
    const data = await response.json();    
    allGenreData = data;
    buildGenreMap(data);
    createTree(data);
    createMobileNav(data, document.getElementById('mobile-genre-list'));

    restoreAccordionState();

    document.getElementById('mobile-nav-container').classList.add('loaded');
    if (loadingSpinner) loadingSpinner.classList.add('hidden');

    const treeBtn = document.getElementById('tree-layout-btn');
    const radialBtn = document.getElementById('radial-layout-btn');

    if (treeBtn && radialBtn) {
        treeBtn.addEventListener('click', () => {
            if (currentLayout === 'vertical') return;
            currentLayout = 'vertical';
            treeBtn.classList.add('active');
            radialBtn.classList.remove('active');
            createTree(allGenreData);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        radialBtn.addEventListener('click', () => {
            if (currentLayout === 'radial') return;
            currentLayout = 'radial';
            radialBtn.classList.add('active');
            treeBtn.classList.remove('active');
            createTree(allGenreData);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    const accordionItems = document.querySelectorAll('#mobile-genre-list .genre-item[aria-expanded]');

    if (expandAllBtn && collapseAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'true');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.add('expanded');
          }
        });
        saveAccordionState();
      });

      collapseAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.remove('expanded');
          }
        });
        saveAccordionState();
      });
    }

    const debouncedCreateTree = debounce(() => createTree(data), 250);
    window.addEventListener('resize', debouncedCreateTree);

    // After all data is loaded and DOM is ready, handle the initial URL.
    handleUrl();

  } catch (error) {
    console.error('Error obtaining data:', error);
  }
}

// Function to handle URL state for deep linking
function handleUrl() {
    let genreIdentifier = null;
    const infoPanel = document.getElementById('info-panel');

    // Priority 1: Check for the injected variable on static pages
    if (window.PR_GENRE_TO_LOAD) {
        genreIdentifier = window.PR_GENRE_TO_LOAD;
        // Clear it after use
        window.PR_GENRE_TO_LOAD = null; 
    } 
    // Priority 2: Check for a genre slug in the path
    else if (window.location.pathname.startsWith('/genres/')) {
        const pathAfterGenres = window.location.pathname.substring('/genres/'.length);
        const slug = pathAfterGenres.replace('.html', '');
        genreIdentifier = slug;
    }
    // Priority 3: Backward compatibility for old hash URLs
    else if (window.location.hash) {
        const hash = decodeURIComponent(window.location.hash.substring(1));
        const pathSegments = hash.split('/');
        genreIdentifier = pathSegments[pathSegments.length - 1].replace(/-/g, ' '); // simple name from hash
    }

    if (genreIdentifier) {
        const targetGenre = findGenre(genreIdentifier);
        if (targetGenre) {
            const entry = genreMap.get(targetGenre.name || targetGenre.style);
            if (entry) {
                let current = entry;
                while (current.parent) {
                    const parentEntry = genreMap.get(current.parent.name || current.parent.style);
                    if (!parentEntry) break;
                    current = parentEntry;
                }
                const topLevelAncestor = current.data;
                const accentColor = colorScale(topLevelAncestor.name || topLevelAncestor.style);
                showInfoPanel(targetGenre, accentColor);
            }
        }
    } else {
        // If no genre is identified in the URL, ensure the panel is closed.
        if (infoPanel.classList.contains('visible')) {
            closeInfoPanel();
        }
    }
}

// Function to create the tree visualization with D3.js
function createTree(data) {
  const svgContainer = d3.select("#treemap");
  // Clear previous SVG content on redraw to avoid duplication
  svgContainer.selectAll("*").remove();

  const containerBounds = svgContainer.node().getBoundingClientRect();
  const containerWidth = containerBounds.width;

  // Configuration based on layout
  let height, innerWidth, innerHeight, margin, treeLayout;
  
  // Transform data to hierarchy first to count nodes
  function transformToHierarchyForCount(node) {
      const newNode = { name: node.name || node.style };
      if (node.substyles && node.substyles.length > 0) {
        newNode.children = node.substyles.map(transformToHierarchyForCount);
      }
      return newNode;
  }
  
  const tempHierarchicalData = {
    name: "Electronic Music",
    children: data.map(transformToHierarchyForCount)
  };
  const tempRoot = d3.hierarchy(tempHierarchicalData);
  const totalNodes = tempRoot.descendants().length;

  if (currentLayout === 'vertical') {
    margin = {top: 20, right: 250, bottom: 20, left: 50};
    // DYNAMIC HEIGHT CALCULATION
    // Base height per node to ensure comfortable spacing
    const nodeSpacing = 22; 
    // Calculate total height needed. Ensure a minimum to avoid cramping with few nodes.
    height = Math.max(1000, totalNodes * nodeSpacing);
    
    innerWidth = containerWidth - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    treeLayout = d3.tree().size([innerHeight, innerWidth]);
  } else {
    // Radial Layout
    margin = {top: 20, right: 20, bottom: 20, left: 20};
    // Ensure the radial layout has enough space and is centered
    const minSize = Math.max(containerWidth, 800);
    height = Math.min(window.innerHeight * 1.8, 1400); 
    innerWidth = containerWidth - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(containerWidth, height) / 2 - 150;
    treeLayout = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
  }

  // Select the SVG container and set its dimensions
  const svg = svgContainer.attr("width", containerWidth)
    .attr("height", height)
    .attr("viewBox", `0 0 ${containerWidth} ${height}`);

  // Add a background rect to handle clicks on whitespace for deselecting (if planned)
  svg.append("rect")
    .attr("width", containerWidth)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("click", () => {
      // Logic to clear highlights
      activeSelectedNode = null;
      clearBranchHighlight();
    });

  // Append a group element and apply the margin
  const g = svg.append("g");
  
  if (currentLayout === 'vertical') {
    g.attr("transform", `translate(${margin.left},${margin.top})`);
  } else {
    g.attr("transform", `translate(${containerWidth / 2},${height / 2})`);
  }

  // Recursive function to transform the flat data into a hierarchical structure
  function transformToHierarchy(node) {
    const newNode = {
      name: node.name || node.style,
      description: node.description,
      example: node.example,
      spotify_track_id: node.spotify_track_id,
      wikipedia_url: node.wikipedia_url,
      substyles: node.substyles
    };
    if (node.substyles && node.substyles.length > 0) {
      newNode.children = node.substyles.map(transformToHierarchy);
    }
    return newNode;
  }

  const hierarchicalData = {
    name: "Electronic Music",
    children: data.map(transformToHierarchy)
  };

  const root = d3.hierarchy(hierarchicalData);
  treeLayout(root);

  // Filter out the "Electronic Music" root node from showing up in the graph
  const nodesToShow = root.descendants().filter(d => d.depth > 0);

  // Link generator with smoother curves for radial
  const linkGenerator = currentLayout === 'vertical' 
    ? d3.linkHorizontal().x(d => d.y).y(d => d.x)
    : d3.linkRadial().angle(d => d.x).radius(d => d.y);

  // Create the links
  g.selectAll('.link')
    .data(root.links().filter(l => l.target.depth > 0)) // Show all links to visible nodes (including from root)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', linkGenerator)
    .style('opacity', 0)
    .transition()
    .duration(800)
    .style('opacity', 1);

  // Create the nodes
  const node = g.selectAll('.node')
    .data(nodesToShow)
    .enter()
    .append('g')
    .attr('class', 'node clickable-node')
    .attr('transform', d => {
        if (currentLayout === 'vertical') {
            return `translate(${d.y},${d.x})`;
        } else {
            // Adjust rotation to keep text readable
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`;
        }
    })
    .attr('tabindex', 0)
    .attr('aria-label', d => d.data.name)
    .style('opacity', 0)
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
        showInfoPanel(d.data, nodeColor);
      }
    })
    .on('mouseover', (event, d) => {
      showTooltip(event, d);
      highlightBranch(event.currentTarget, d);
    })
    .on('mouseout', () => {
      hideTooltip();
      if (!lastHighlightedNode || lastHighlightedNode !== activeSelectedNode) {
        clearBranchHighlight();
      }
    })
    .on('click', (event, d) => {
      event.stopPropagation();
      const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
      
      // Persist highlight on click
      activeSelectedNode = d;
      highlightBranch(event.currentTarget, d);
      
      showInfoPanel(d.data, nodeColor);
    });

  // Entry animation for nodes
  node.transition()
    .duration(800)
    .delay((d, i) => i * 2)
    .style('opacity', 1);

  node.each(function(d) { d.gNode = this; });

  node.append('circle')
    .attr('r', 6)
    .style('fill', d => {
      const topLevelAncestor = d.ancestors().find(ancestor => ancestor.depth === 1);
      if (topLevelAncestor) {
        return colorScale(topLevelAncestor.data.name);
      }
      return '#999';
    })
    .style('stroke', '#fff')
    .style('stroke-width', '1.5px');

  node.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => {
        if (currentLayout === 'vertical') return d.children ? -10 : 10;
        return d.x < Math.PI ? 10 : -10;
    })
    .attr('text-anchor', d => {
        if (currentLayout === 'vertical') return d.children ? 'end' : 'start';
        return d.x < Math.PI ? 'start' : 'end';
    })
    .attr('transform', d => {
        if (currentLayout === 'vertical') return null;
        return d.x >= Math.PI ? 'rotate(180)' : null;
    })
    .style('font-family', '"Outfit", sans-serif')
    .style('font-size', '14px')
    .style('fill', document.body.classList.contains('light-mode') ? '#333' : '#fff')
    .style('font-weight', d => d.children ? '600' : '400')
    .text(d => d.data.name);

  // Add a radial gradient or glow effect if desired (via CSS is easier)
}

/**
 * Highlights the branch from the target node to the root.
 */
function highlightBranch(element, d) {
  lastHighlightedNode = d;
  const ancestors = d.ancestors();
  const nodeColor = d3.select(element).select('circle').style('fill');

  // Clear ANY existing highlights first to prevent accumulation
  d3.selectAll('.node, .link')
    .classed('path-highlight-node', false)
    .classed('path-highlight-link', false);

  // Apply highlight color to the container for CSS access (including SVG filters)
  d3.select('#visualization-container').style('--highlight-color', nodeColor);

  d3.selectAll('.node').classed('faded', true);
  d3.selectAll('.link').classed('faded', true);

  ancestors.forEach(ancestor => {
    d3.selectAll('.node').filter(n => n === ancestor)
      .classed('faded', false)
      .classed('path-highlight-node', true);
  });

  d3.selectAll('.link')
    .filter(link => ancestors.includes(link.target) && ancestors.includes(link.source))
    .classed('faded', false)
    .classed('path-highlight-link', true);
}

/**
 * Clears all branch highlights.
 */
function clearBranchHighlight() {
  lastHighlightedNode = null;
  
  // If there's an active selected node, re-highlight it instead of clearing
  if (activeSelectedNode) {
    // We need to find the DOM element for the active node
    const nodeToHighlight = d3.selectAll('.node').filter(n => n === activeSelectedNode);
    if (!nodeToHighlight.empty()) {
      highlightBranch(nodeToHighlight.node(), activeSelectedNode);
      return;
    }
  }

  d3.selectAll('.node, .link')
    .classed('faded', false)
    .classed('path-highlight-node', false)
    .classed('path-highlight-link', false);
}

/**
 * Shares the genre via the Web Share API or copies the link to the clipboard.
 * @param {Object} itemData
 */
async function shareGenre(itemData) {
  const genreName = itemData.name || itemData.style;
  const genreSlug = getGenrePath(itemData);
  const shareUrl = `${window.location.origin}/genres/${genreSlug}.html`;
  const shareText = `Discover ${genreName} on PulseRoots: Electronic Music Styles Tree`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'PulseRoots',
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      const shareBtn = document.querySelector('.share-btn');
      const originalHTML = shareBtn.innerHTML;
      shareBtn.innerHTML = `<i class="bi bi-check-lg"></i> Copied!`;
      shareBtn.style.background = 'var(--accent-cyan)';
      
      setTimeout(() => {
        shareBtn.innerHTML = originalHTML;
        shareBtn.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  }
}

// --- Panel Closing Logic ---
function closeInfoPanel() {
  const infoPanel = document.getElementById('info-panel');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');

  document.getElementById('main-container').removeAttribute('aria-hidden');
  document.querySelector('header').removeAttribute('aria-hidden');
  document.querySelector('footer').removeAttribute('aria-hidden');

  infoPanel.classList.remove('visible');
  overlay.classList.remove('visible');

  spotifyEmbed.innerHTML = '';

  activeSelectedNode = null;
  clearBranchHighlight();

  const genreSchema = document.getElementById('genre-schema');
  if (genreSchema) {
    genreSchema.remove();
  }

  // Reset the URL to the base if we are on a genre page
  if (window.location.pathname.includes('/genres/')) {
    history.pushState(null, '', '/');
  }

  if (focusedElementBeforePanel) {
    focusedElementBeforePanel.focus();
  }
}

/**
 * Creates a nested, collapsible navigation list for mobile view.
 * @param {Array} items - The array of genre or sub-genre objects.
 * @param {HTMLElement} parentElement - The <ul> element to which the list items will be appended.
 */
function createMobileNav(items, parentElement, parentColor = null) {
  items.forEach(item => {
    const baseId = `${slugify(item.style || item.name)}-${Math.random().toString(36).substr(2, 9)}`;
    const subListId = `sub-list-${baseId}`;

    const listItem = document.createElement('li');
    const itemElement = document.createElement(item.substyles && item.substyles.length > 0 ? 'button' : 'div');

    itemElement.dataset.action = 'toggle';
    itemElement.dataset.itemData = JSON.stringify(item); 
    itemElement.className = 'genre-item';

    const currentColor = parentColor || colorScale(item.style || item.name);
    itemElement.style.setProperty('--genre-color', currentColor);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'genre-name';
    nameSpan.textContent = item.style || item.name;
    nameSpan.dataset.originalText = item.style || item.name;
    itemElement.appendChild(nameSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'genre-actions';

    if (item.wikipedia_url) {
      const wikiIconLink = document.createElement('a');
      wikiIconLink.href = item.wikipedia_url;
      wikiIconLink.target = '_blank';
      wikiIconLink.rel = 'noopener noreferrer';
      wikiIconLink.className = 'bi bi-wikipedia wiki-icon';
      wikiIconLink.dataset.action = 'wiki';
      wikiIconLink.setAttribute('aria-label', `Read more about ${item.style || item.name} on Wikipedia`);
      actionsDiv.appendChild(wikiIconLink);
    }

    const infoIcon = document.createElement('i');
    infoIcon.className = 'bi bi-info-circle-fill info-icon';
    infoIcon.dataset.action = 'info';
    infoIcon.setAttribute('aria-label', `Info for ${item.style || item.name}`);
    actionsDiv.appendChild(infoIcon);


    if (item.substyles && item.substyles.length > 0) {
      const indicator = document.createElement('span');
      indicator.className = 'indicator';
      indicator.innerHTML = '&#43;';
      actionsDiv.appendChild(indicator);

      const buttonId = `btn-${baseId}`;
      itemElement.id = buttonId;
      itemElement.setAttribute('aria-expanded', 'false');
      itemElement.setAttribute('aria-controls', subListId);

      const subList = document.createElement('ul');
      subList.className = 'sub-list';
      subList.id = subListId;
      subList.setAttribute('role', 'region');
      subList.setAttribute('aria-labelledby', buttonId);
      createMobileNav(item.substyles, subList, currentColor);

      listItem.appendChild(itemElement);
      listItem.appendChild(subList);
    } else {
      listItem.appendChild(itemElement);
    }

    itemElement.appendChild(actionsDiv);
    parentElement.appendChild(listItem);
  });
}

/**
 * Performs a search on both the D3 tree and the mobile accordion list.
 * @param {string} searchTerm The text to search for.
 */
function performSearch(searchTerm) {
  const term = searchTerm.toLowerCase();

  const treeNodes = d3.selectAll('.node');
  treeNodes.classed('searched-node', false);
  if (term) {
    treeNodes
      .filter(d => d.data.name.toLowerCase().includes(term))
      .classed('searched-node', true);
  }

  const mobileListItems = document.querySelectorAll('#mobile-genre-list li');
  if (!mobileListItems.length) return;

  mobileListItems.forEach(li => {
    const itemElement = li.querySelector('.genre-item');
    const nameSpan = itemElement.querySelector('.genre-name');
    const originalText = nameSpan.dataset.originalText;
    const isMatch = term && originalText.toLowerCase().includes(term);

    li.style.display = 'block';

    if (isMatch) {
      itemElement.classList.add('searched-item');
      const regex = new RegExp(`(${term})`, 'gi');
      nameSpan.innerHTML = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');

      let parent = li.parentElement;
      while (parent && parent.id !== 'mobile-genre-list') {
        if (parent.classList.contains('sub-list')) {
          parent.classList.add('expanded');
          const controllingButton = document.querySelector(`[aria-controls="${parent.id}"]`);
          if (controllingButton) {
            controllingButton.setAttribute('aria-expanded', 'true');
          }
        }
        parent = parent.parentElement;
      }
    } else {
      itemElement.classList.remove('searched-item');
      nameSpan.innerHTML = originalText;
    }
  });
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
  
  fetchData();

  document.getElementById('close-panel').addEventListener('click', closeInfoPanel);
  document.getElementById('modal-overlay').addEventListener('click', closeInfoPanel);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const infoPanel = document.getElementById('info-panel');
      if (infoPanel.classList.contains('visible')) {
        closeInfoPanel();
      }
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    handleUrl();
  });

  const mobileNavContainer = document.getElementById('mobile-genre-list');
  mobileNavContainer.addEventListener('click', (event) => {
    const target = event.target;
    const itemElement = target.closest('.genre-item');
    if (!itemElement) return;

    const action = target.dataset.action || itemElement.dataset.action;
    const itemData = JSON.parse(itemElement.dataset.itemData);
    const accentColor = itemElement.style.getPropertyValue('--genre-color');

    switch (action) {
      case 'toggle':
        const subListId = itemElement.getAttribute('aria-controls');
        if (subListId) {
          const subList = document.getElementById(subListId);
          subList.classList.toggle('expanded');
          const isExpanded = subList.classList.contains('expanded');
          itemElement.setAttribute('aria-expanded', isExpanded);
          saveAccordionState();
        }
        break;
      case 'info':
        event.stopPropagation();
        showInfoPanel(itemData, accentColor);
        break;
      case 'wiki':
        event.stopPropagation();
        break;
    }
  });

  const searchInput = document.getElementById('search-input');
  const debouncedSearch = debounce((term) => performSearch(term), 300);

  const suggestionsContainer = document.getElementById('search-suggestions');
  let currentFocus = -1;

  function updateSuggestions(term) {
    if (!term) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.add('hidden');
      return;
    }

    const matches = Array.from(genreMap.values())
      .filter(entry => (entry.data.name || entry.data.style).toLowerCase().includes(term.toLowerCase()))
      .slice(0, 10);

    if (matches.length > 0) {
      suggestionsContainer.innerHTML = '';
      matches.forEach((match, index) => {
        const name = match.data.name || match.data.style;
        const familyNode = match.parent ? (function getRoot(node) {
            let curr = node;
            while (curr.parent) {
                const parentEntry = genreMap.get(curr.parent.name || curr.parent.style);
                if (!parentEntry) break;
                curr = parentEntry;
            }
            return curr.data.name || curr.data.style;
        })(match) : 'Family';

        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
          <span class="suggestion-name">${name}</span>
          <span class="suggestion-family">${familyNode}</span>
        `;
        
        div.addEventListener('click', () => {
          searchInput.value = name;
          suggestionsContainer.innerHTML = '';
          suggestionsContainer.classList.add('hidden');
          
          performSearch(name);
          
          const d3Node = d3.selectAll('.clickable-node').filter(d => (d.data.name || d.data.style) === name).datum();
          if (d3Node) {
              const topLevelAncestor = d3Node.ancestors().find(ancestor => ancestor.depth === 1);
              const color = topLevelAncestor ? colorScale(topLevelAncestor.data.name) : '#ff0055';
              showInfoPanel(d3Node.data, color);
          }
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.classList.remove('hidden');
    } else {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.add('hidden');
    }
  }

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value;
    updateSuggestions(term);
    debouncedSearch(term);
  });

  searchInput.addEventListener('keydown', (event) => {
    const items = suggestionsContainer.getElementsByClassName('suggestion-item');
    if (event.key === 'ArrowDown') {
      currentFocus++;
      addActive(items);
    } else if (event.key === 'ArrowUp') {
      currentFocus--;
      addActive(items);
    } else if (event.key === 'Enter') {
      if (currentFocus > -1) {
        if (items[currentFocus]) items[currentFocus].click();
      } else {
        performSearch(searchInput.value);
        suggestionsContainer.classList.add('hidden');
      }
    } else if (event.key === 'Escape') {
        suggestionsContainer.classList.add('hidden');
    }
  });

  function addActive(items) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (items.length - 1);
    items[currentFocus].classList.add('active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('active');
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== suggestionsContainer) {
      suggestionsContainer.classList.add('hidden');
    }
  });

  document.getElementById('search-button').addEventListener('click', () => {
    performSearch(searchInput.value);
    suggestionsContainer.classList.add('hidden');
  });

  document.getElementById('clear-button').addEventListener('click', () => {
    searchInput.value = '';
    performSearch('');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.add('hidden');
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  });

  document.getElementById('current-year').textContent = new Date().getFullYear();

  const infoBox = document.getElementById('tooltip');
  if (infoBox) {
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = 'Read More';
    readMoreBtn.className = 'read-more-btn';

    infoBox.appendChild(readMoreBtn);

    readMoreBtn.addEventListener('click', () => {
      const isExpanded = infoBox.classList.toggle('is-expanded');
      readMoreBtn.textContent = isExpanded ? 'Read Less' : 'Read More';
    });
  }

  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn) {
    const originalIconClass = 'bi-clipboard';
    const successIconClass = 'bi-clipboard-check-fill';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const icon = copyBtn.querySelector('i');
        icon.classList.remove(originalIconClass);
        icon.classList.add(successIconClass);
        copyBtn.setAttribute('aria-label', 'Link copied!');

        setTimeout(() => {
          icon.classList.remove(successIconClass);
          icon.classList.add(originalIconClass);
          copyBtn.setAttribute('aria-label', 'Copy link to clipboard');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        copyBtn.setAttribute('aria-label', 'Failed to copy!');
      });
    });
  }

  const backToTopBtn = document.getElementById('back-to-top-btn');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
        setTimeout(() => backToTopBtn.style.opacity = '1', 10);
      } else {
        backToTopBtn.style.opacity = '0';
        setTimeout(() => {
          if (window.scrollY <= 300) backToTopBtn.style.display = 'none';
        }, 300);
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  if (fullscreenBtn && document.fullscreenEnabled) {
    const fullscreenIcon = fullscreenBtn.querySelector('i');

    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        fullscreenIcon.classList.replace('bi-fullscreen', 'bi-fullscreen-exit');
        fullscreenBtn.setAttribute('aria-label', 'Exit Fullscreen');
      } else {
        fullscreenIcon.classList.replace('bi-fullscreen-exit', 'bi-fullscreen');
        fullscreenBtn.setAttribute('aria-label', 'Enter Fullscreen');
      }
    });
  } else if (fullscreenBtn) {
    fullscreenBtn.style.display = 'none';
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    const themeIcon = themeToggleBtn.querySelector('i');
    
    const currentTheme = 'dark';
    document.body.classList.remove('light-mode');
    colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    d3.selectAll('.node text').style('fill', '#fff');
    d3.selectAll('.link').attr('stroke', d => colorScale(d.target.data.name));
    themeIcon.classList.replace('bi-sun', 'bi-moon');
    themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
    
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      
      colorScale = isLight ? d3.scaleOrdinal(d3.schemeSet2) : d3.scaleOrdinal(d3.schemeTableau10);
      
      const linkColor = isLight ? '#9ca3af' : d => colorScale(d.target.data.name);
      d3.selectAll('.node circle').attr('fill', d => colorScale(d.data.name));
      d3.selectAll('.link').attr('stroke', linkColor);
      d3.selectAll('.node text').style('fill', isLight ? '#333' : '#fff');
      
      if (isLight) {
        themeIcon.classList.replace('bi-moon', 'bi-sun');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
      } else {
        themeIcon.classList.replace('bi-sun', 'bi-moon');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
      }
    });
  }

  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + "%";
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  const shuffleBtn = document.getElementById('shuffle-button');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const allNodes = d3.selectAll('.clickable-node').data();
      
      if (allNodes.length > 0) {
        const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];
        
        const nodeSelection = d3.selectAll('.clickable-node')
          .filter(d => d === randomNode);
        
        const nodeColor = nodeSelection.select('circle').style('fill');
        showInfoPanel(randomNode.data, nodeColor);

        d3.selectAll('.node').classed('faded', true);
        d3.selectAll('.link').classed('faded', true);
        d3.selectAll('.node').classed('path-highlight-node', false);
        d3.selectAll('.link').classed('path-highlight-link', false);

        randomNode.ancestors().forEach(ancestor => {
            d3.selectAll('.node').filter(d => d === ancestor)
                .classed('faded', false)
                .classed('path-highlight-node', true);
        });

        d3.selectAll('.link')
            .filter(link => randomNode.ancestors().includes(link.target))
            .classed('faded', false)
            .classed('path-highlight-link', true);
            
      }
    });
  }

  const historyBanner = document.getElementById('history-banner');
  const historyFactSpan = document.getElementById('history-fact');
  historyFactSpan.style.opacity = '1';
  let historyInterval;

  async function fetchHistoryFacts() {
    try {
      const response = await fetch('/music_history.json');
      const facts = await response.json();
      return facts;
    } catch (error) {
      console.error('Error fetching music history facts:', error);
      return [];
    }
  }

  function displayRandomFact(facts) {
    if (facts.length === 0) {
      historyBanner.style.display = 'none';
      return;
    }
    
    historyFactSpan.style.opacity = '0';
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * facts.length);
      const fact = facts[randomIndex];
      historyFactSpan.innerHTML = `<strong>${fact.date}:</strong> ${fact.fact}`;
      historyBanner.style.display = 'block';
      historyFactSpan.style.opacity = '1';
    }, 500);
  }

  async function startHistoryBanner() {
    const facts = await fetchHistoryFacts();
    if (facts.length > 0) {
      displayRandomFact(facts);
      historyInterval = setInterval(() => displayRandomFact(facts), 10000);
    }
  }

  startHistoryBanner();
});
