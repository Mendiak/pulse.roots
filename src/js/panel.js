import { state } from './state.js';
import { slugify, getGenrePath, truncateDescription } from './utils.js';

const STRINGS = {
  en: {
    share: 'Share',
    shareTitle: 'Share this genre',
    closePanel: 'Close info panel',
    noDescription: 'No description available.',
    readMoreWikipedia: 'Read more on Wikipedia',
    exampleTrack: 'Example track',
    spotifyNote: 'A Spotify account may be required to listen to the full track.',
    keyArtists: 'Key Artists',
    partOf: 'Part of',
    goToParent: 'Go to {name}',
    subgenres: 'Subgenres & Related',
    buyCoffee: 'Buy me a coffee',
    reportError: 'Report an error'
  },
  es: {
    share: 'Compartir',
    shareTitle: 'Compartir este género',
    closePanel: 'Cerrar panel de información',
    noDescription: 'No hay descripción disponible.',
    readMoreWikipedia: 'Leer más en Wikipedia',
    exampleTrack: 'Pista de ejemplo',
    spotifyNote: 'Es posible que se necesite una cuenta de Spotify para escuchar la pista completa.',
    keyArtists: 'Artistas clave',
    partOf: 'Parte de',
    goToParent: 'Ir a {name}',
    subgenres: 'Subgéneros y relacionados',
    buyCoffee: 'Invítame a un café',
    reportError: 'Reportar un error'
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

function updateSchemaOrg(itemData) {
  const existingSchema = document.getElementById('genre-schema');
  if (existingSchema) {
    existingSchema.remove();
  }

  const genreName = itemData.name || itemData.style;
  const genreDescription = itemData.description || 'An electronic music genre.';
  const genreUrl = window.location.href;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'MusicGenre',
    'name': genreName,
    'description': genreDescription,
    'url': genreUrl,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': window.location.origin + state.BASE_PATH + window.location.pathname.replace(state.BASE_PATH, '')
    }
  };

  if (itemData.wikipedia_url) {
    schemaData.sameAs = itemData.wikipedia_url;
  }

  if (itemData.spotify_track_id) {
    schemaData.exampleOfWork = {
      '@type': 'MusicRecording',
      'name': itemData.example || `Example track for ${genreName}`,
      'url': `https://open.spotify.com/track/${itemData.spotify_track_id}`
    };
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'genre-schema';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}

export function showInfoPanel(inputData, accentColor = '#ff0066') {
  const genreNameForLookup = inputData.name || inputData.style;
  const genreEntry = state.genreMap.get(genreNameForLookup);
  const itemData = genreEntry ? genreEntry.data : inputData;

  updateSchemaOrg(itemData);

  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const overlay = document.getElementById('modal-overlay');
  const scrollIndicator = document.getElementById('scroll-indicator');

  const genreSlug = getGenrePath(itemData);
  const newPath = `${state.BASE_PATH}/genres/${genreSlug}.html`;
  const newUrl = `${window.location.origin}${newPath}`;

  if (window.location.pathname !== newPath) {
    history.pushState({ genre: genreNameForLookup }, '', newUrl);
  }

  document.querySelector('link[rel="canonical"]').setAttribute('href', newUrl);
  document.querySelector('meta[property="og:url"]').setAttribute('content', newUrl);
  const newTitle = `PulseRoots: ${itemData.name || itemData.style}`;
  document.title = newTitle;
  document.querySelector('meta[property="og:title"]').setAttribute('content', newTitle);
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', newTitle);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', accentColor);
  }

  state.focusedElementBeforePanel = document.activeElement;
  document.getElementById('main-container').setAttribute('aria-hidden', 'true');
  document.querySelector('header').setAttribute('aria-hidden', 'true');
  document.querySelector('footer').setAttribute('aria-hidden', 'true');

  overlay.classList.add('visible');
  infoPanel.style.setProperty('--panel-accent-color', accentColor);

  const breadcrumbsContainer = document.createElement('div');
  breadcrumbsContainer.className = 'breadcrumbs';

  let currentForBreadcrumbs = genreEntry;
  const breadcrumbsPath = [];
  while (currentForBreadcrumbs) {
    breadcrumbsPath.unshift(currentForBreadcrumbs.data);
    currentForBreadcrumbs = currentForBreadcrumbs.parent ? state.genreMap.get(currentForBreadcrumbs.parent.name || currentForBreadcrumbs.parent.style) : null;
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

  infoContent.innerHTML = '';

  infoContent.classList.remove('animate-entry');
  void infoContent.offsetWidth;
  infoContent.classList.add('animate-entry');

  const title = document.createElement('h2');
  title.id = 'info-panel-title';
  title.innerHTML = `<i class="bi bi-tag-fill"></i> ${itemData.name || itemData.style}`;

  const shareBtn = document.createElement('button');
  shareBtn.className = 'nav-link-btn share-btn';
  shareBtn.innerHTML = `<i class="bi bi-share-fill"></i> <span>${str('share')}</span>`;
  shareBtn.title = str('shareTitle');
  shareBtn.addEventListener('click', () => {
    shareGenre(itemData);
  });

  const closeButton = document.createElement('button');
  closeButton.id = 'close-panel';
  closeButton.setAttribute('aria-label', str('closePanel'));
  closeButton.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
  closeButton.addEventListener('click', closeInfoPanel);

  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'panel-header-wrapper';
  headerWrapper.appendChild(title);
  headerWrapper.appendChild(shareBtn);
  headerWrapper.appendChild(closeButton);

  const stickyHeader = document.createElement('div');
  stickyHeader.className = 'panel-sticky-header';
  stickyHeader.appendChild(breadcrumbsContainer);
  stickyHeader.appendChild(headerWrapper);

  infoContent.appendChild(stickyHeader);

  const desc = document.createElement('p');
  desc.textContent = itemData.description || str('noDescription');
  infoContent.appendChild(desc);

  if (itemData.wikipedia_url) {
    const wikiLinkContainer = document.createElement('div');
    wikiLinkContainer.className = 'external-link-container';

    const wikiLink = document.createElement('a');
    wikiLink.href = itemData.wikipedia_url;
    wikiLink.target = '_blank';
    wikiLink.rel = 'noopener noreferrer';
    wikiLink.className = 'wikipedia-link';

    wikiLink.innerHTML = `<i class="bi bi-wikipedia"></i> ${str('readMoreWikipedia')}`;

    wikiLinkContainer.appendChild(wikiLink);
    infoContent.appendChild(wikiLinkContainer);
  }

  const example = document.createElement('p');
  example.className = 'example-track';
  example.innerHTML = `<i class="bi bi-soundwave"></i> <span>${str('exampleTrack')}: <b>${itemData.example || 'N/A'}</b></span>`;
  infoContent.appendChild(example);

  if (itemData.key_artists && itemData.key_artists.length > 0) {
    const artistsSection = document.createElement('div');
    artistsSection.className = 'nav-section artists-section';
    artistsSection.innerHTML = `<p class="nav-label">${str('keyArtists')}</p>`;

    const artistsSlider = document.createElement('div');
    artistsSlider.className = 'artists-slider';

    itemData.key_artists.forEach(artist => {
      const artistCard = document.createElement('a');
      artistCard.className = 'artist-card';

      const artistUrl = artist.url.startsWith('http')
        ? artist.url
        : `https://open.spotify.com/artist/${artist.url}`;

      artistCard.href = artistUrl;
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

  if (genreEntry && genreEntry.parent) {
    const parent = genreEntry.parent;
    const parentName = parent.name || parent.style;

    const parentNav = document.createElement('div');
    parentNav.className = 'nav-section parent-nav';
    parentNav.innerHTML = `
      <p class="nav-label">${str('partOf')}</p>
      <button class="nav-link-btn parent-link" aria-label="${str('goToParent', { name: parentName })}">
        <i class="bi bi-arrow-up-circle"></i> ${parentName}
      </button>
    `;

    parentNav.querySelector('button').addEventListener('click', () => {
      showInfoPanel(parent, accentColor);
    });

    infoContent.appendChild(parentNav);
  }

  if (itemData.substyles && itemData.substyles.length > 0) {
    const subgenresNav = document.createElement('div');
    subgenresNav.className = 'nav-section subgenres-nav';
    subgenresNav.innerHTML = `<p class="nav-label">${str('subgenres')}</p>`;

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

  const panelFooter = document.createElement('div');
  panelFooter.className = 'panel-footer';

  const donationLink = document.createElement('a');
  donationLink.href = 'https://www.buymeacoffee.com/Mendiak';
  donationLink.target = '_blank';
  donationLink.rel = 'noopener noreferrer';
  donationLink.className = 'panel-footer-link';
  donationLink.innerHTML = '<i class="bi bi-cup-hot"></i> ' + str('buyCoffee');
  panelFooter.appendChild(donationLink);

  const genreNameEncoded = encodeURIComponent(itemData.name || itemData.style);
  const reportLink = document.createElement('a');
  reportLink.href = `contact.html?genre=${genreNameEncoded}&subject=Error%20Report`;
  reportLink.className = 'panel-footer-link';
  reportLink.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${str('reportError')}`;
  panelFooter.appendChild(reportLink);

  infoContent.appendChild(panelFooter);

  const miniPlayer = document.getElementById('mini-player');
  if (miniPlayer && miniPlayer.classList.contains('visible')) {
    infoContent.style.paddingBottom = (miniPlayer.offsetHeight + 16) + 'px';
  }

  setTimeout(() => {
    if (infoPanel.scrollHeight > infoPanel.clientHeight) {
      scrollIndicator.classList.remove('hidden');
    } else {
      scrollIndicator.classList.add('hidden');
    }
  }, 500);

  infoPanel.onscroll = () => {
    scrollIndicator.classList.add('hidden');
  };

  scrollIndicator.onclick = () => {
    infoPanel.scroll({
      top: infoPanel.scrollTop + 200,
      behavior: 'smooth'
    });
  };

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

export async function closeInfoPanel() {
  const infoPanel = document.getElementById('info-panel');
  const spotifyEmbed = document.getElementById('spotify-embed');
  const overlay = document.getElementById('modal-overlay');
  const scrollIndicator = document.getElementById('scroll-indicator');

  document.getElementById('main-container').removeAttribute('aria-hidden');
  document.querySelector('header').removeAttribute('aria-hidden');
  document.querySelector('footer').removeAttribute('aria-hidden');

  infoPanel.classList.remove('visible');
  overlay.classList.remove('visible');
  scrollIndicator.classList.add('hidden');

  if (spotifyEmbed) {
    spotifyEmbed.innerHTML = '';
    spotifyEmbed.remove();
  }

  state.activeSelectedNode = null;
  const { clearBranchHighlight } = await import('./tree.js');
  clearBranchHighlight();

  const genreSchema = document.getElementById('genre-schema');
  if (genreSchema) {
    genreSchema.remove();
  }

  if (window.location.pathname.includes('/genres/')) {
    history.pushState(null, '', '/pulse.roots/');
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', '#080808');
  }

  if (state.focusedElementBeforePanel) {
    state.focusedElementBeforePanel.focus();
  }
}

export async function shareGenre(itemData) {
  const genreName = itemData.name || itemData.style;
  const genreSlug = getGenrePath(itemData);
  const shareUrl = `${window.location.origin}${state.BASE_PATH}/genres/${genreSlug}.html`;
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
    try {
      await navigator.clipboard.writeText(shareUrl);

      const shareBtn = document.querySelector('.share-btn');
      const originalHTML = shareBtn.innerHTML;
      shareBtn.innerHTML = `<i class="bi bi-check-lg"></i> Copied!`;
      shareBtn.style.background = 'var(--accent-pink)';

      setTimeout(() => {
        shareBtn.innerHTML = originalHTML;
        shareBtn.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  }
}
