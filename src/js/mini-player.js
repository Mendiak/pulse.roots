import { state } from './state.js';

let currentTrackId = null;
let isActive = false;

const STRINGS = {
  en: {
    nowPlaying: 'Now Playing',
    viewDetails: 'View Details',
    close: 'Close player',
    readWikipedia: 'Read about {name} on Wikipedia',
    keyArtists: 'Key Artists'
  },
  es: {
    nowPlaying: 'Reproduciendo',
    viewDetails: 'Ver detalles',
    close: 'Cerrar reproductor',
    readWikipedia: 'Leer sobre {name} en Wikipedia',
    keyArtists: 'Artistas clave'
  }
};

function str(key, replacements = {}) {
  const lang = (window.PR_LANG === 'es') ? 'es' : 'en';
  let val = STRINGS[lang][key];
  if (val === undefined) val = STRINGS.en[key];
  if (typeof val !== 'string') return key;
  if (Object.keys(replacements).length === 0) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => replacements[k] != null ? replacements[k] : `{${k}}`);
}

function renderArtists(artists) {
  const container = document.getElementById('mini-player-artists');
  if (!container) return;
  if (!artists || artists.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  container.innerHTML = '';
  artists.forEach(artist => {
    const chip = document.createElement('a');
    chip.className = 'artist-chip';
    const artistUrl = artist.url.startsWith('http')
      ? artist.url
      : `https://open.spotify.com/artist/${artist.url}`;
    chip.href = artistUrl;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';
    chip.innerHTML = `<i class="bi bi-spotify"></i> ${artist.name}`;
    container.appendChild(chip);
  });
}

export function playGenre(genreData, accentColor) {
  const trackId = genreData.spotify_track_id;
  if (!trackId) return;

  const miniPlayer = document.getElementById('mini-player');
  if (!miniPlayer) return;

  const wasSameTrack = currentTrackId === trackId && miniPlayer.classList.contains('visible');
  currentTrackId = trackId;
  isActive = true;

  miniPlayer.style.setProperty('--mini-accent', accentColor || '#ff0066');

  const embedContainer = document.getElementById('mini-player-embed');
  const genreNameEl = document.getElementById('mini-player-genre');
  const trackNameEl = document.getElementById('mini-player-track');
  const labelEl = document.getElementById('mini-player-label');
  const descEl = document.getElementById('mini-player-desc');
  const wikiLink = document.getElementById('mini-player-wiki');

  const genreName = genreData.name || genreData.style;

  if (labelEl) labelEl.textContent = str('nowPlaying');
  if (genreNameEl) genreNameEl.textContent = genreName;
  if (trackNameEl) trackNameEl.textContent = genreData.example ? `\u2014 ${genreData.example}` : '';

  if (descEl) {
    descEl.textContent = genreData.description || '';
    descEl.classList.toggle('hidden', !genreData.description);
  }

  renderArtists(genreData.key_artists);

  if (wikiLink) {
    if (genreData.wikipedia_url) {
      wikiLink.href = genreData.wikipedia_url;
      wikiLink.setAttribute('aria-label', str('readWikipedia', { name: genreName }));
      wikiLink.classList.remove('hidden');
    } else {
      wikiLink.classList.add('hidden');
    }
  }

  if (!wasSameTrack) {
    embedContainer.innerHTML = `
      <iframe
        src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator"
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify track preview"
        style="border-radius:8px;display:block;min-width:250px"
      ></iframe>
    `;
  }

  if (!miniPlayer.classList.contains('visible')) {
    requestAnimationFrame(() => {
      miniPlayer.classList.add('visible');
    });
  }
}

export function stopMiniPlayer() {
  isActive = false;
  currentTrackId = null;

  const miniPlayer = document.getElementById('mini-player');
  if (!miniPlayer) return;

  miniPlayer.classList.remove('visible');
  setTimeout(() => {
    const embedContainer = document.getElementById('mini-player-embed');
    if (embedContainer) embedContainer.innerHTML = '';
  }, 350);
}

export function isPlaying() {
  return isActive;
}

export function initMiniPlayer() {
  const miniPlayer = document.getElementById('mini-player');
  if (!miniPlayer) return;

  const closeBtn = document.getElementById('mini-player-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', stopMiniPlayer);
  }

  const detailsBtn = document.getElementById('mini-player-details');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', async () => {
      if (!currentTrackId) return;
      const entry = Array.from(state.genreMap.values())
        .find(e => e.data.spotify_track_id === currentTrackId);
      if (entry) {
        const topLevelAncestor = entry.parent ? (function getRoot(node) {
          let curr = node;
          while (curr.parent) {
            const parentEntry = state.genreMap.get(curr.parent.name || curr.parent.style);
            if (!parentEntry) break;
            curr = parentEntry;
          }
          return curr.data.name || curr.data.style;
        })(entry) : (entry.data.name || entry.data.style);
        const color = state.colorScale(topLevelAncestor);
        const { showInfoPanel } = await import('./panel.js');
        showInfoPanel(entry.data, color);
      }
    });
  }

  const detailsText = document.getElementById('mini-player-details-text');
  if (detailsText) detailsText.textContent = str('viewDetails');

  const closeAria = document.getElementById('mini-player-close');
  if (closeAria) closeAria.setAttribute('aria-label', str('close'));
}
