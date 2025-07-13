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

function showInfoPanel(itemData, accentColor = '#ff0055') {
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');
  const closeButton = document.getElementById('close-panel');

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
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator" width="100%" height="160" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
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

// Function to fetch data from the JSON file
async function fetchData() {
  try {
    // Fetch the data from the JSON file
    const response = await fetch('pulseroots.genres.json');
    const data = await response.json();    
    createTree(data); // Initial tree creation for desktop
    createMobileNav(data, document.getElementById('mobile-genre-list')); // Create mobile nav

    // Show the mobile navigation container now that it's populated
    document.getElementById('mobile-nav-container').classList.add('loaded');

    // --- Accordion Controls Logic ---
    // This logic is moved here to ensure it runs AFTER the mobile nav is created.
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    // Now that createMobileNav has run, the items exist and can be selected.
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
      });

      collapseAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.remove('expanded');
          }
        });
      });
    }

    window.addEventListener('resize', () => createTree(data)); // Redraw tree on resize
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
  items.forEach(item => {
    // Use a unique ID for linking controls and content, good for accessibility
    const baseId = `${(item.style || item.name).replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    const subListId = `sub-list-${baseId}`;

    const listItem = document.createElement('li');
    // Use a <button> for parent items for better accessibility, and a <div> for leaf nodes.
    const itemElement = document.createElement(item.substyles && item.substyles.length > 0 ? 'button' : 'div');
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
      wikiIconLink.setAttribute('aria-label', `Read more about ${item.style || item.name} on Wikipedia`);
      wikiIconLink.addEventListener('click', (e) => e.stopPropagation()); // Prevent accordion toggle
      actionsDiv.appendChild(wikiIconLink);
    }

    // Add info icon for ALL items
    const infoIcon = document.createElement('i');
    infoIcon.className = 'bi bi-info-circle-fill info-icon';
    infoIcon.setAttribute('aria-label', `Info for ${item.style || item.name}`);
    infoIcon.addEventListener('click', (event) => {
      event.stopPropagation(); // Stop propagation to prevent parent click handlers
      showInfoPanel(item);
    });
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

      // Event listener for the whole item (expand/collapse)
      itemElement.addEventListener('click', () => {
        subList.classList.toggle('expanded');
        const isExpanded = subList.classList.contains('expanded');
        itemElement.setAttribute('aria-expanded', isExpanded);
      });
    } else { // If it's a leaf node (no substyles)
      listItem.appendChild(itemElement);
      // No click listener on the item itself, only on the icons
    }

    // Append the actions to the item element
    itemElement.appendChild(actionsDiv);
    parentElement.appendChild(listItem);
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

  // --- Search Logic ---
  document.getElementById('search-button').addEventListener('click', () => {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (!searchTerm) return;

    // Remove previous search highlights
    d3.selectAll('.node').classed('searched-node', false);

    // Apply new search highlights
    d3.selectAll('.node')
      .filter(d => d.data.name.toLowerCase().includes(searchTerm))
      .classed('searched-node', true);
  });

  document.getElementById('clear-button').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    d3.selectAll('.node').classed('searched-node', false);
  });

  document.getElementById('search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('search-button').click();
    }
  });

  // --- Footer Year ---
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // --- Initial Data Load ---
  // This function will now be called safely after the DOM is ready.
  fetchData();
});
