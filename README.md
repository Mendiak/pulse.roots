# PulseRoots: Electronic Music Styles Tree

PulseRoots is an interactive visualization of the evolution of electronic music. It presents the complex web of genres and subgenres as a hierarchical tree, allowing users to explore the history, characteristics, and sounds of electronic music through an intuitive interface.

**Live Demo:** [https://mendiak.github.io/pulse.roots/](https://mendiak.github.io/pulse.roots/)

## Features

- **Interactive Visualization**: Choose between Tree and Radial layouts powered by D3.js.
- **Deep Historical Context**: Detailed descriptions and Wikipedia links for hundreds of genres.
- **Curated Listening**: Sample tracks via integrated Spotify embeds for every style.
- **Search & Discover**: Find specific genres or use the "Shuffle" feature for random discovery.
- **Responsive Design**: Fully optimized for both desktop (interactive map) and mobile (accordion navigation).
- **SEO Optimized**: Dynamic sitemap generation and JSON-LD structured data.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), D3.js (v6), Bootstrap Icons.
- **Data & Tools**: Spotify Web API.

## Setup & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mendiak/pulse.roots.git
   cd pulse.roots
   ```

2. **Run Locally**:
   Simply open `index.html` in a modern web browser, or use a local server like `Live Server` in VS Code for the best experience.

## Data Structure

The project's heart is `data/pulseroots.genres.json`. It follows a recursive tree structure:

```json
{
  "style": "Genre Name",
  "description": "Historical and sonic description...",
  "example": "Artist - Track Name",
  "spotify_track_id": "Spotify_ID",
  "wikipedia_url": "https://en.wikipedia.org/...",
  "key_artists": [
    { "name": "Artist Name", "url": "Spotify_Artist_URL" }
  ],
  "substyles": [
    /* Recursive substyle objects */
  ]
}
```

### Node.js (Maintenance)
- `build.js`: Consolidates SEO and data maintenance. It generates `sitemap.xml` and all individual genre HTML pages in the `genres/` directory based on the hierarchy in `data/pulseroots.genres.json`.
- **Usage**: `node build.js`

## Project Structure

```
pulse.roots/
├── src/
│   └── js/                    # ES6 modules (type="module")
│       ├── main.js            # Entry point, orchestration
│       ├── state.js           # Shared state between modules
│       ├── utils.js           # Utilities (debounce, slugify, etc.)
│       ├── tree.js            # D3.js tree visualization
│       ├── panel.js           # Genre info panel
│       ├── mobile-nav.js      # Mobile accordion navigation
│       ├── search.js          # Search with suggestions
│       ├── particles.js       # Particle background
│       └── theme.js           # Theme toggle, fullscreen, shuffle
├── data/
│   ├── pulseroots.genres.json # The database of genres
│   └── music_history.json     # Historical music facts
├── assets/                    # Images, icons, branding
├── genres/                    # Generated genre pages (via build.js)
├── index.html                 # Main entry point
├── styles.css                 # Custom styling and responsive design
├── build.js                   # Build and maintenance script (Node.js)
├── package.json               # Project metadata
├── contact.html               # Contact page
├── privacy.html               # Privacy policy
├── thanks.html                # Redirection page for the contact form
├── sitemap.xml                # SEO sitemap
├── sitemap.html               # HTML sitemap
└── robots.txt                 # Robots exclusion
```

## Contributing

Contributions are welcome! Whether it's correcting a genre description, adding new substyles, or improving the visualization logic:
1. Fork the repo.
2. Create your feature branch.
3. Submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

---
*PulseRoots - Explore the roots, discover the sound.*
