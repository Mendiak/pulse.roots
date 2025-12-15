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
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

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

function showInfoPanel(itemData, accentColor = '#ff0055') {
  // Update Schema.org data
  updateSchemaOrg(itemData);

  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');
  const closeButton = document.getElementById('close-panel');

  // --- SEO: Update Title and Meta Description ---
  const genreName = itemData.name || itemData.style;
  document.title = `PulseRoots: Explore ${genreName}`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', `Learn about the ${genreName} genre in electronic music. ${itemData.description.substring(0, 120)}...`);
  }
  // Update the URL hash
  history.pushState(null, '', `#${encodeURIComponent(genreName.replace(/\s+/g, '-'))}`);


  // --- Accessibility: Store focus and hide background content ---
  focusedElementBeforePanel = document.activeElement;
  document.getElementById('main-container').setAttribute('aria-hidden', 'true');
  document.querySelector('header').setAttribute('aria-hidden', 'true');
  document.querySelector('footer').setAttribute('aria-hidden', 'true');

  // Show the overlay
  overlay.classList.add('visible');
  // Set the panel's accent border color
  infoPanel.style.setProperty('--panel-accent-color', accentColor);

  // Update the info panel with the node's data.
  // Add an ID to the h2 to be used by aria-labelledby on the panel.
  infoContent.innerHTML = `
    <h2 id="info-panel-title"><i class="bi bi-tag-fill"></i> ${itemData.name || itemData.style}</h2>
    <p>${itemData.description || 'No description available'}</p>
    <p><i class="bi bi-soundwave"></i> <b>Example track: ${itemData.example || 'N/A'}</b></p>
  `;

  // --- NEW: Wikipedia Link Logic ---
  // Check if the item has a Wikipedia URL and add the link button if it does.
  if (itemData.wikipedia_url) {
    const wikiLinkContainer = document.createElement('div');
    wikiLinkContainer.className = 'external-link-container';

    const wikiLink = document.createElement('a');
    wikiLink.href = itemData.wikipedia_url;
    wikiLink.target = '_blank'; // Open in a new tab
    wikiLink.rel = 'noopener noreferrer';
    wikiLink.className = 'wikipedia-link';
    
    // Use an icon from Bootstrap Icons
    wikiLink.innerHTML = `<i class="bi bi-wikipedia"></i> Read more on Wikipedia`;

    wikiLinkContainer.appendChild(wikiLink);
    infoContent.appendChild(wikiLinkContainer);
  }

  // Embed the Spotify player only if a trackId exists
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

  // Show the info panel
  infoPanel.classList.add('visible');

  // --- Accessibility: Move focus into the panel without an initial jarring focus ring ---
  // Add a class to temporarily suppress the focus style on programmatic focus
  closeButton.classList.add('programmatic-focus');
  closeButton.focus();

  // Remove the class after a short delay, so subsequent keyboard focus works as expected
  setTimeout(() => {
    closeButton.classList.remove('programmatic-focus');
  }, 150); // A brief, imperceptible delay

  const focusableElements = infoPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  infoPanel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else { // Tab
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

// Function to fetch data from the JSON file
async function fetchData() {
  const loadingSpinner = document.getElementById('loading-spinner');
  try {
    if (loadingSpinner) loadingSpinner.classList.remove('hidden'); // Show spinner

    // Fetch the data from the JSON file
    const response = await fetch('pulseroots.genres.json');
    const data = await response.json();    
    createTree(data); // Initial tree creation for desktop
    createMobileNav(data, document.getElementById('mobile-genre-list')); // Create mobile nav

    // Restore the accordion state after it has been created
    restoreAccordionState();

    // Show the mobile navigation container now that it's populated
    document.getElementById('mobile-nav-container').classList.add('loaded');
    if (loadingSpinner) loadingSpinner.classList.add('hidden'); // Hide spinner

    // --- Accordion Controls Logic ---
    // This logic is moved here to ensure it runs AFTER the mobile nav is created.
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    // Now that createMobileNav has run, the items exist and can be selected.
    const accordionItems = document.querySelectorAll('#mobile-genre-list .genre-item[aria-expanded]');
    const allSubLists = document.querySelectorAll('#mobile-genre-list .sub-list');

    if (expandAllBtn && collapseAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'true');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.add('expanded'); // This is correct
          }
        });
        saveAccordionState();
      });

      collapseAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.remove('expanded'); // This is correct
          }
        });
        saveAccordionState();
      });
    }

    // --- PERFORMANCE: Debounce the resize event to avoid excessive redraws ---
    const debouncedCreateTree = debounce(() => createTree(data), 250);
    window.addEventListener('resize', debouncedCreateTree);

  } catch (error) {
    console.error('Error obtaining data:', error);
  }
}

// Function to create the tree visualization with D3.js
function createTree(data) {
  const svgContainer = d3.select("#treemap");
  // Clear previous SVG content on redraw to avoid duplication
  svgContainer.selectAll("*").remove();

  // Define margins and calculate inner dimensions for the chart
  const margin = {top: 20, right: 250, bottom: 20, left: 50};
  const containerWidth = svgContainer.node().getBoundingClientRect().width;
  const height = 3500; // Adjusted height for more compact view
  const innerWidth = containerWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Select the SVG container and set its dimensions
  const svg = svgContainer.attr("width", containerWidth)
    .attr("height", height)
    .attr("viewBox", `0 0 ${containerWidth} ${height}`);

  // Append a group element and apply the margin, all drawing will happen in here
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Recursive function to transform the flat data into a hierarchical structure
  function transformToHierarchy(node) {
    const newNode = {
      name: node.name || node.style, // Handles both root 'style' and nested 'name'
      description: node.description,
      example: node.example,
      spotify_track_id: node.spotify_track_id,
      wikipedia_url: node.wikipedia_url,
    };
    if (node.substyles && node.substyles.length > 0) {
      newNode.children = node.substyles.map(transformToHierarchy);
    }
    return newNode;
  }

  // Transform the data into a hierarchical structure
  const hierarchicalData = {
    name: "Electronic Music",
    children: data.map(transformToHierarchy)
  };

  // Create a hierarchical data structure from the transformed data
  const root = d3.hierarchy(hierarchicalData);

  // Create a tree layout with the specified dimensions
  // The layout is horizontal, so height is for the y-axis and width for the x-axis
  const treeLayout = d3.tree().size([innerHeight, innerWidth]);

  // Filter the nodes to only show the ones that are not the root node
  const nodesToShow = root.descendants().slice(1);

  // Apply the tree layout to the data
  treeLayout(root);

  // Create the links between the nodes
  g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  // Create the nodes
  const node = g.selectAll('.node')
    .data(nodesToShow) // Bind the filtered data
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .attr('class', d => d.depth > 0 ? 'node clickable-node' : 'node')
    // A11y: Make nodes focusable
    .attr('tabindex', d => d.depth > 0 ? 0 : -1)
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // Trigger the same logic as click
        const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
        showInfoPanel(d.data, nodeColor);
      }
    })
    .on('mouseover', (event, d) => {
      showTooltip(event, d);

      // --- Path Highlighting Logic ---
      // Get all nodes and links and add a "faded" class
      d3.selectAll('.node').classed('faded', true);
      d3.selectAll('.link').classed('faded', true);

      // Highlight the current node and its ancestors
      d.ancestors().forEach(ancestor => {
        d3.select(ancestor.gNode)
          .classed('faded', false)
          .classed('path-highlight-node', true);
      });

      // Highlight the links connecting the ancestors
      d3.selectAll('.link')
        .filter(link => d.ancestors().includes(link.target))
        .classed('faded', false)
        .classed('path-highlight-link', true);
    })
    .on('mouseout', () => {
      hideTooltip();
      // Remove all highlighting and fading
      d3.selectAll('.node, .link').classed('faded', false).classed('path-highlight-node', false).classed('path-highlight-link', false);
    })
    .on('click', (event, d) => {
      if (d.depth === 0) return;
      // Get the color from the D3 node to use as an accent
      const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
      // Call the reusable function to show the panel
      showInfoPanel(d.data, nodeColor);
    });

  // Attach the DOM node to each data point for easy selection later
  node.each(function(d) { d.gNode = this; }); // This is used for path highlighting

  // Add the circles for the nodes
  node.append('circle')
    .attr('r',6)
    .style('fill', d => {
      if (d.depth === 0) return '#000';  // Root node color
      // Find the top-level genre ancestor (at depth 1) to determine the color family.
      const topLevelAncestor = d.ancestors().find(ancestor => ancestor.depth === 1);
      if (topLevelAncestor) {
        return colorScale(topLevelAncestor.data.name);
      }
      return '#999';  // Fallback color for any nodes that might not fit the structure
    });

  // Add the text labels for the nodes
  node.append('text')
    .attr('dy', 3)
    .attr('x', d => d.children ? -8 : 8)
    .style('text-anchor', d => d.children ? 'end' : 'start')
    .style('font-family', 'Aleo, serif')
    .style('font-size', '14px')
    .text(d => d.depth === 0 ? '' : d.data.name);
}

// --- Panel Closing Logic ---
function closeInfoPanel() {
  const infoPanel = document.getElementById('info-panel');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');

  // --- Accessibility: Un-hide background content and restore focus ---
  document.getElementById('main-container').removeAttribute('aria-hidden');
  document.querySelector('header').removeAttribute('aria-hidden');
  document.querySelector('footer').removeAttribute('aria-hidden');

  // Hide the panel
  infoPanel.classList.remove('visible');
  // Hide the overlay
  overlay.classList.remove('visible');

  // Stop the music by clearing the iframe content
  spotifyEmbed.innerHTML = '';

  // Remove dynamically added Schema.org script
  const genreSchema = document.getElementById('genre-schema');
  if (genreSchema) {
    genreSchema.remove();
  }

  // --- Accessibility: Return focus to the element that opened the panel ---
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
  // This function now only handles the creation of the DOM structure.
  items.forEach(item => {
    // Use a unique ID for linking controls and content, good for accessibility
    const baseId = `${(item.style || item.name).replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    const subListId = `sub-list-${baseId}`;

    const listItem = document.createElement('li');
    // Use a <button> for parent items for better accessibility, and a <div> for leaf nodes.
    const itemElement = document.createElement(item.substyles && item.substyles.length > 0 ? 'button' : 'div');

    // --- REFACTORED: Add data attributes for event delegation ---
    itemElement.dataset.action = 'toggle'; // For expanding/collapsing
    itemElement.dataset.itemData = JSON.stringify(item); // Store item data directly

    itemElement.className = 'genre-item';

    // Determine the color for this item.
    // If it's a top-level genre, get a new color. If it's a sub-genre, inherit from the parent.
    const currentColor = parentColor || colorScale(item.style || item.name);

    // Apply the color as a CSS custom property for styling.
    itemElement.style.setProperty('--genre-color', currentColor);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'genre-name';
    nameSpan.textContent = item.style || item.name;
    // Store original text for search highlighting
    nameSpan.dataset.originalText = item.style || item.name;
    itemElement.appendChild(nameSpan);

    // --- UNIFIED ACTIONS CONTAINER ---
    // All items get an actions container for a consistent UI
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'genre-actions';

    // Add Wikipedia icon if it exists
    if (item.wikipedia_url) {
      const wikiIconLink = document.createElement('a');
      wikiIconLink.href = item.wikipedia_url;
      wikiIconLink.target = '_blank';
      wikiIconLink.rel = 'noopener noreferrer';
      wikiIconLink.className = 'bi bi-wikipedia wiki-icon';
      wikiIconLink.dataset.action = 'wiki'; // For event delegation
      wikiIconLink.setAttribute('aria-label', `Read more about ${item.style || item.name} on Wikipedia`);
      actionsDiv.appendChild(wikiIconLink);
    }

    // Add info icon for ALL items
    const infoIcon = document.createElement('i');
    infoIcon.className = 'bi bi-info-circle-fill info-icon';
    infoIcon.dataset.action = 'info'; // For event delegation
    infoIcon.setAttribute('aria-label', `Info for ${item.style || item.name}`);
    actionsDiv.appendChild(infoIcon);


    // If it's a parent node (has substyles), add expand/collapse functionality
    if (item.substyles && item.substyles.length > 0) {
      // Create the expand/collapse indicator
      const indicator = document.createElement('span');
      indicator.className = 'indicator';
      indicator.innerHTML = '&#43;'; // Plus sign
      actionsDiv.appendChild(indicator);

      // Accessibility attributes for the button
      const buttonId = `btn-${baseId}`;
      itemElement.id = buttonId;
      itemElement.setAttribute('aria-expanded', 'false');
      itemElement.setAttribute('aria-controls', subListId);

      const subList = document.createElement('ul');
      subList.className = 'sub-list';
      subList.id = subListId; // Assign the unique ID
      subList.setAttribute('role', 'region'); // ARIA role for content panel
      subList.setAttribute('aria-labelledby', buttonId); // Link panel to its button
      createMobileNav(item.substyles, subList, currentColor); // Pass the color down to children

      listItem.appendChild(itemElement);
      listItem.appendChild(subList);
    } else { // If it's a leaf node (no substyles)
      listItem.appendChild(itemElement);
    }

    // Append the actions to the item element
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

  // --- D3 Tree Search (Desktop) ---
  const treeNodes = d3.selectAll('.node');
  treeNodes.classed('searched-node', false); // Clear previous results
  if (term) {
    treeNodes
      .filter(d => d.data.name.toLowerCase().includes(term))
      .classed('searched-node', true);
  }

  // --- Accordion Search (Mobile) ---
  const mobileListItems = document.querySelectorAll('#mobile-genre-list li');
  if (!mobileListItems.length) return;

  mobileListItems.forEach(li => {
    const itemElement = li.querySelector('.genre-item');
    const nameSpan = itemElement.querySelector('.genre-name');
    const originalText = nameSpan.dataset.originalText;
    const isMatch = term && originalText.toLowerCase().includes(term);

    // Show/hide the list item itself
    li.style.display = 'block'; // Reset display before checking

    // Highlight logic
    if (isMatch) {
      itemElement.classList.add('searched-item');
      // Highlight the matching text
      const regex = new RegExp(`(${term})`, 'gi');
      nameSpan.innerHTML = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');

      // Expand all parents of the matched item
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
      nameSpan.innerHTML = originalText; // Restore original text
    }
  });
}

// --- Main Execution ---
// This ensures the script runs only after the entire HTML document has been loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Panel Closing Logic ---
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

  // --- EFFICIENCY: Event Delegation for Mobile Accordion ---
  const mobileNavContainer = document.getElementById('mobile-genre-list');
  mobileNavContainer.addEventListener('click', (event) => {
    const target = event.target;
    const itemElement = target.closest('.genre-item');
    if (!itemElement) return; // Click was not on an item

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
        // The link will navigate on its own, we just need to stop propagation
        // to prevent the accordion from toggling.
        event.stopPropagation();
        break;
    }
  });

  // --- Search Logic ---
  const searchInput = document.getElementById('search-input');
  
  // Real-time search with debounce
  const debouncedSearch = debounce((term) => performSearch(term), 300);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  document.getElementById('search-button').addEventListener('click', () => {
    performSearch(searchInput.value);
  });

  document.getElementById('clear-button').addEventListener('click', () => {
    searchInput.value = '';
    performSearch(''); // Clear search results
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch(event.target.value);
    }
  });

  // --- Footer Year ---
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // --- Initial Data Load ---
  // This function will now be called safely after the DOM is ready.
  fetchData();

  // --- "Read More" Logic for Mobile Description ---
  const infoBox = document.getElementById('tooltip'); // The main description box
  if (infoBox) {
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = 'Read More';
    readMoreBtn.className = 'read-more-btn';

    // Append the button inside the info-box, it will be visible at the bottom of the collapsed content
    infoBox.appendChild(readMoreBtn);

    readMoreBtn.addEventListener('click', () => {
      infoBox.classList.add('is-expanded'); // Expand the box using the CSS class
      readMoreBtn.style.display = 'none'; // Hide the button after clicking
    });
  }

  // --- NEW: Copy Link Button in Footer ---
  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn) {
    const originalIconClass = 'bi-clipboard';
    const successIconClass = 'bi-clipboard-check-fill';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        // --- Success Feedback ---
        const icon = copyBtn.querySelector('i');
        icon.classList.remove(originalIconClass);
        icon.classList.add(successIconClass);
        copyBtn.setAttribute('aria-label', 'Link copied!');

        // Revert back after 2 seconds
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

  // --- Back to Top Logic ---
  const backToTopBtn = document.getElementById('back-to-top-btn');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
        // Small delay to allow display:block to apply before opacity transition
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

  // --- NEW: Fullscreen API Logic ---
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  // Check if the Fullscreen API is supported by the browser
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

    // Listen for changes in fullscreen state (e.g., user pressing Esc) to update the icon
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
    // Hide the button if the API is not supported
    fullscreenBtn.style.display = 'none';
  }
});
