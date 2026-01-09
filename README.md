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
- **Analytics & SEO**: Google Tag Manager, Schema.org (JSON-LD), Node.js (for sitemap).
- **Data & Tools**: Python (for data enrichment), Spotify Web API.

## Setup & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mendiak/pulse.roots.git
   cd pulse.roots
   ```

2. **Run Locally**:
   Simply open `index.html` in a modern web browser, or use a local server like `Live Server` in VS Code for the best experience.

## Data Structure

The project's heart is `pulseroots.genres.json`. It follows a recursive tree structure:

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

## Maintenance Scripts

### Python (Data Management)
Located in the root, these scripts help maintain the `pulseroots.genres.json` file.
- `populate_artists.py`: Automatically fetches Spotify URLs for artists using the Spotify API.
- `audit_artists.py`: Checks for missing URLs or data inconsistencies in the JSON.

**Setup**:
1. Copy `.env.example` to `.env` and add your Spotify API credentials.
2. Install dependencies: `pip install python-dotenv requests`.
3. Run: `python populate_artists.py`.

### Node.js (SEO Maintenance)
- `generate-sitemap.js`: Generates a `sitemap.xml` based on the genre hierarchy to improve search engine indexing.
- **Usage**: `node generate-sitemap.js`

## Project Structure

- `index.html`: Main entry point and layout.
- `script.js`: Core logic for D3.js visualization, search, and interactions.
- `styles.css`: Custom styling and responsive design.
- `pulseroots.genres.json`: The database of genres.
- `assets/`: Images, icons, and branding assets.
- `generate-sitemap.js`: Sitemap generator (Node.js).
- `populate_artists.py` / `audit_artists.py`: Data maintenance scripts (Python).
- `sitemap.xml` / `robots.txt`: SEO files.
- `thanks.html`: Redirection page for the contact form.

## Contributing

Contributions are welcome! Whether it's correcting a genre description, adding new substyles, or improving the visualization logic:
1. Fork the repo.
2. Create your feature branch.
3. Submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

---
*PulseRoots - Explore the roots, discover the sound.*
