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

// Function to fetch data from the JSON file
async function fetchData() {
  try {
    // Fetch the data from the JSON file
    const response = await fetch('pulseroots.genres.json');
    const data = await response.json();
    console.log('Received data from JSON:', data);
    
    // Initial tree creation
    createTree(data);
    // Redraw on window resize for responsiveness
    window.addEventListener('resize', () => createTree(data));
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

  // Create a color scale for the nodes
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

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
      // Handle the click event on the nodes
      if (d.depth === 0) {
        return; 
      }
      const infoPanel = document.getElementById('info-panel');
      const infoContent = document.getElementById('info-content');
      const spotifyEmbed = document.getElementById('spotify-embed');
      const overlay = document.getElementById('modal-overlay');

      // Show the overlay
      overlay.classList.add('visible');
      // Get node color and set it as a CSS variable for the panel's accent border
      const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
      infoPanel.style.setProperty('--panel-accent-color', nodeColor);

      // Update the info panel with the node's data
      infoContent.innerHTML = `
        <h2><i class="bi bi-tag-fill"></i> ${d.data.name}</h2>
        <p>${d.data.description || 'No description available'}</p>
        <p><i class="bi bi-soundwave"></i> <b>Example track: ${d.data.example || 'N/A'}</b></p>
      `;

      // Embed the Spotify player only if a trackId exists
      const trackId = d.data.spotify_track_id;
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
    });

  // Attach the DOM node to each data point for easy selection later
  node.each(function(d) { d.gNode = this; }); // This is used for path highlighting

  // Add the circles for the nodes
  node.append('circle')
    .attr('r',6)
    .style('fill', d => {
      if (d.depth === 0) return '#000';  // Root node
      if (d.depth === 1) return colorScale(d.data.name);  // Main genres
      if (d.parent) return colorScale(d.parent.data.name);  // Subgenres inherit parent color
      return '#999';  // Fallback color
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

  // Hide the panel
  infoPanel.classList.remove('visible');
  // Hide the overlay
  overlay.classList.remove('visible');

  // Stop the music by clearing the iframe content
  spotifyEmbed.innerHTML = '';
}

// Add event listeners to close the panel
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

// Add event listener for the search button
document.getElementById('search-button').addEventListener('click', () => {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  if (!searchTerm) return;

  // Remove previous search highlights
  d3.selectAll('.node').classed('searched-node', false);

  // Apply new search highlights
  d3.selectAll('.node')
    .filter(d => d.data.name.toLowerCase().includes(searchTerm))
    .classed('searched-node', true)
    .each(d => {
      // Optional: expand parents to make the node visible if you implement collapsible nodes
      let current = d;
      while (current.parent) {
        // Logic to expand would go here
        current = current.parent;
      }
    });
});

// Add event listener for the clear button
document.getElementById('clear-button').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  d3.selectAll('.node').classed('searched-node', false);
});

// Add event listener to trigger search on "Enter" key press
document.getElementById('search-input').addEventListener('keydown', (event) => {
  // Check if the key pressed was "Enter"
  if (event.key === 'Enter') {
    // Prevent the default action (like form submission, though not applicable here)
    event.preventDefault();
    // Trigger a click on the search button to reuse its logic
    document.getElementById('search-button').click();
  }
});

// Call the function to fetch the data
fetchData();

// Dynamically update the copyright year in the footer
document.getElementById('current-year').textContent = new Date().getFullYear();
