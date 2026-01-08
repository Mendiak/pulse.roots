# PulseRoots: Electronic Music Styles Tree

PulseRoots is an interactive visualization of electronic music genres and subgenres, presented as a hierarchical tree structure. This project aims to educate and entertain music enthusiasts by showcasing the diverse world of electronic music.

## Features

- Interactive tree visualization of electronic music genres
- Detailed information about each genre and subgenre
- Spotify track embeds for sample listening
- Responsive design for various screen sizes

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- D3.js for tree visualization
- Spotify embeds for music playback

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Mendiak/pulse.roots.git
cd pulse.roots
```

2. Open `index.html` in a modern web browser.

### Python Scripts Setup (Optional)

If you want to use the artist population scripts:

1. Install Python dependencies:
```bash
pip install python-dotenv requests
```

2. Create a `.env` file with your Spotify API credentials:
```bash
cp .env.example .env
# Edit .env and add your Spotify credentials
```

3. Get Spotify API credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

4. Run the scripts:
```bash
python populate_artists.py  # Populate missing artist URLs
python audit_artists.py     # Verify artist data
```

## Usage

- Navigate through the tree structure to explore different electronic music genres and subgenres.
- Click on any node in the tree to view detailed information about that genre or subgenre.
- Listen to sample tracks directly from the info panel using the embedded Spotify player.

## Project Structure

- `index.html`: Main HTML file
- `styles.css`: CSS styles for the project
- `script.js`: JavaScript file containing the D3.js visualization and interaction logic
- `pulseroots.genres.json`: JSON file containing the hierarchical data of electronic music genres
- `populate_artists.py`: Python script to populate artist Spotify URLs
- `audit_artists.py`: Python script to verify artist data integrity
- `.env.example`: Template for environment variables (Spotify API credentials)

## Contributing

Contributions to PulseRoots are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For any questions, feedback, or issues, please open an issue on this repository.

Enjoy exploring the world of electronic music with PulseRoots!
