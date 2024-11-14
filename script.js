// Function to fetch data from the JSON file
async function fetchData() {
  try {
    // Fetch the data from the JSON file
    const response = await fetch('pulseroots.genres.json');
    const data = await response.json();
    console.log('Received data from JSON:', data);
    // Call the function to create the tree visualization
    createTree(data);
  } catch (error) {
    console.error('Error obtaining data:', error);
  }
}

// Function to create the tree visualization with D3.js
function createTree(data) {
  // Set the dimensions of the SVG container
  const width = 1300;
  const height = 3000;

  // Create a color scale for the nodes
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  // Select the SVG container and set its dimensions
  const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`) 
    .style("display", "block") 
    .style("margin", "0 auto"); 

  // Transform the data into a hierarchical structure
  const hierarchicalData = {
    name: "Electronic Music",
    children: data.map(style => ({
      name: style.style,
      description: style.description,
      example: style.example,
      spotify_track_id: style.spotify_track_id,
      children: style.substyles.map(substyle => ({
        name: substyle.name,
        description: substyle.description,
        example: substyle.example,
        spotify_track_id: substyle.spotify_track_id,
        children: substyle.substyles ? substyle.substyles.map(subsubstyle => ({
          name: subsubstyle.name,
          description: subsubstyle.description,
          example: subsubstyle.example,
          spotify_track_id: subsubstyle.spotify_track_id,
          children: subsubstyle.substyles ? subsubstyle.substyles.map(subsubsubstyle => ({
            name: subsubsubstyle.name,
            description: subsubsubstyle.description,
            example: subsubsubstyle.example,
            spotify_track_id: subsubsubstyle.spotify_track_id
          })) : undefined
        })) : undefined
      }))
    }))
  };

  // Create a hierarchical data structure from the transformed data
  const root = d3.hierarchy(hierarchicalData);

  // Create a tree layout with the specified dimensions
  const treeLayout = d3.tree().size([height, width -200]);

  // Filter the nodes to only show the ones that are not the root node
  const nodesToShow = root.descendants().slice(1);

  // Apply the tree layout to the data
  treeLayout(root);

  // Create the links between the nodes
  svg.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  // Create the nodes
  const node = svg.selectAll('.node')
    .data(nodesToShow) // Bind the filtered data
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .attr('class', d => d.depth === 1 || d.depth === 2 || d.depth === 3 || d.depth === 4 ? 'node clickable-node' : 'node')
    .on('click', (event, d) => {
      // Handle the click event on the nodes
      if (d.depth === 0) {
        return; 
      }
      const infoPanel = document.getElementById('info-panel');
      const infoContent = document.getElementById('info-content');
      const spotifyEmbed = document.getElementById('spotify-embed');

      // Update the info panel with the node's data
      infoContent.innerHTML = `
        <h2><i class="bi bi-tag-fill"></i> ${d.data.name}</h2>
        <p>${d.data.description || 'No description available'}</p>
        <p><i class="bi bi-soundwave"></i> <b>Example track: ${d.data.example || 'N/A'}</b></p>
      `;

      // Access the spotify_track_id correctly
      const trackId = d.data.spotify_track_id || '1234567890';
      console.log('Track ID:', trackId);

      // Embed the Spotify player for the selected track
      spotifyEmbed.innerHTML = `
        <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator" width="100%" height="160" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      `;

      // Show the info panel
      infoPanel.classList.add('visible');
    });

  // Add the tooltip functionality
  node.on('mouseover', (event, d) => {
    if (d.depth === 0) return; // Don't show tooltip for the root node

    // Create a div element for the tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Add content to the tooltip
    tooltip.html(`
      <h3>${d.data.name}</h3>
      <p>${d.data.description || 'No description available'}</p>
      <p><i class="bi bi-hand-index"></i> Click the node to listen the example track.</p>
    `);

    // Animate the tooltip's appearance
    tooltip.transition()
      .duration(200)
      .style('opacity', 0.9);

    // Position the tooltip near the node
    tooltip.style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  });

  node.on('mouseout', (event, d) => {
    // Remove the tooltip when the mouse leaves the node
    d3.select('.tooltip').remove();
  });

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

// Add an event listener to close the info panel
document.getElementById('close-panel').addEventListener('click', () => {
  document.getElementById('info-panel').classList.remove('visible');
});

// Call the function to fetch the data
fetchData();
