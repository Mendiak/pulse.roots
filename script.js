// Función para obtener los datos del archivo JSON
async function fetchData() {
    try {
      const response = await fetch('pulseroots.genres.json');
      const data = await response.json();
      console.log('Datos recibidos del archivo JSON:', data);
      createTree(data);
    } catch (error) {
      console.error('Error al obtener los datos:', error);
    }
  }
  

  // Función para crear el árbol con D3.js
 function createTree(data) {
    const width = 1300;
    const height = 3000;
  
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
    
      
  
    const root = d3.hierarchy(hierarchicalData);
  
    const treeLayout = d3.tree().size([height, width - 150]);

  
    treeLayout(root);
  
    svg.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));
  
    const node = svg.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.depth === 0 ? d.y + 97: d.y},${d.x})`)
      .attr('class', d => d.depth === 1 || d.depth === 2 || d.depth === 3 || d.depth === 4 ? 'node clickable-node' : 'node')
      .on('click', (event, d) => {
        if (d.depth === 0) {
          return; 
        }
        const infoPanel = document.getElementById('info-panel');
        const infoContent = document.getElementById('info-content');
        const spotifyEmbed = document.getElementById('spotify-embed');
      
        infoContent.innerHTML = `
          <h2>${d.data.name}</h2>
          <p>${d.data.description || 'No description available'}</p>
          <p><b>Example track: ${d.data.example || 'N/A'}</b></p>
        `;
      
        // Acceder correctamente al spotify_track_id
        const trackId = d.data.spotify_track_id || '1234567890';
        console.log('Track ID:', trackId);
      
        spotifyEmbed.innerHTML = `
          <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator" width="100%" height="160" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        `;
      
        infoPanel.classList.add('visible');
      });           
  
    node.append('circle')
      .attr('r',6);
      
  
    node.append('text')
      .attr('dy', 3)
      .attr('x', d => d.children ? -8 : 8)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .style('font-family', 'Arimo, sans-serif')
      .text(d => d.data.name);
  }
  
  document.getElementById('close-panel').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('visible');
  });  
  
// Llama a la función para obtener los datos
fetchData();
