import * as d3 from 'd3';
import { t, applyI18nToDOM } from './i18n.js';
import { state } from './state.js';
import { buildGenreMap, debounce, slugify, findGenre } from './utils.js';
import { createTree, highlightBranch, clearBranchHighlight, scrollToNode } from './tree.js';
import { showInfoPanel, closeInfoPanel, reopenPanel, stopMiniPlayer } from './panel.js';
import { createMobileNav, saveAccordionState, restoreAccordionState } from './mobile-nav.js';
import { performSearch, navigateToMatch, setupDesktopSearch } from './search.js';
import { initParticles } from './particles.js';
import { initThemeToggle, initFullscreen, initShuffle } from './theme.js';
import { renderStats } from './stats.js';
import { createTimeline } from './timeline.js';

const STRINGS = {
  en: {
    readMore: 'Read more',
    readLess: 'Read less',
    linkCopied: 'Link copied!',
    copyLinkToClipboard: 'Copy link to clipboard',
    failedToCopy: 'Failed to copy'
  },
  es: {
    readMore: 'Leer más',
    readLess: 'Leer menos',
    linkCopied: '¡Enlace copiado!',
    copyLinkToClipboard: 'Copiar enlace al portapapeles',
    failedToCopy: 'Error al copiar'
  }
};

function str(key) {
  const lang = (window.PR_LANG === 'es') ? 'es' : 'en';
  let val = STRINGS[lang][key];
  if (val === undefined) val = STRINGS.en[key];
  return typeof val === 'string' ? val : key;
}

async function fetchData() {
  const loadingSpinner = document.getElementById('loading-spinner');
  try {
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    const langSuffix = window.PR_LANG && window.PR_LANG !== 'en' ? `.${window.PR_LANG}` : '';
    const fetchUrl = `${state.BASE_PATH}/data/pulseroots.genres${langSuffix}.json`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} at ${fetchUrl}`);
    }
    const data = await response.json();
    state.allGenreData = data;
    buildGenreMap(data);
    renderStats(data);
    createTree(data);
    createMobileNav(data, document.getElementById('mobile-genre-list'));

    restoreAccordionState();

    document.getElementById('mobile-nav-container').classList.add('loaded');
    if (loadingSpinner) loadingSpinner.classList.add('hidden');

    const treeBtn = document.getElementById('tree-layout-btn');
    const radialBtn = document.getElementById('radial-layout-btn');
    const timelineBtn = document.getElementById('timeline-layout-btn');

    function setLayout(layout) {
      if (state.currentLayout === layout) return;
      state.currentLayout = layout;
      [treeBtn, radialBtn, timelineBtn].forEach(btn => btn && btn.classList.toggle('active', btn.id === `${layout}-layout-btn`));
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const container = document.getElementById('visualization-container');
      container.classList.add('switching');
      setTimeout(() => {
        if (layout === 'timeline') {
          createTimeline();
        } else {
          createTree(state.allGenreData);
        }
        container.classList.remove('switching');
      }, 250);
    }

    if (treeBtn) treeBtn.addEventListener('click', () => setLayout('vertical'));
    if (radialBtn) radialBtn.addEventListener('click', () => setLayout('radial'));
    if (timelineBtn) timelineBtn.addEventListener('click', () => setLayout('timeline'));

    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
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
        saveAccordionState();
      });

      collapseAllBtn.addEventListener('click', () => {
        accordionItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
          const subList = document.getElementById(item.getAttribute('aria-controls'));
          if (subList) {
            subList.classList.remove('expanded');
          }
        });
        saveAccordionState();
      });
    }

    const debouncedCreateTree = debounce(() => {
      if (state.currentLayout === 'timeline') {
        createTimeline();
      } else {
        createTree(data);
      }
    }, 250);
    window.addEventListener('resize', debouncedCreateTree);

    handleUrl();
  } catch (error) {
    console.error('Error obtaining data:', error);
  }
}

function handleUrl() {
  let genreIdentifier = null;
  const infoPanel = document.getElementById('info-panel');

  if (window.PR_GENRE_TO_LOAD) {
    genreIdentifier = window.PR_GENRE_TO_LOAD;
    window.PR_GENRE_TO_LOAD = null;
  } else if (window.location.pathname.includes('/genres/')) {
    const genresIndex = window.location.pathname.indexOf('/genres/');
    const pathAfterGenres = window.location.pathname.substring(genresIndex + '/genres/'.length);
    const slug = pathAfterGenres.replace('.html', '');
    genreIdentifier = slug;
  } else if (window.location.hash) {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    const pathSegments = hash.split('/');
    genreIdentifier = pathSegments[pathSegments.length - 1].replace(/-/g, ' ');
  }

  if (genreIdentifier) {
    const targetGenre = findGenre(genreIdentifier);
    if (targetGenre) {
      const entry = state.genreMap.get(targetGenre.name || targetGenre.style);
      if (entry) {
        let current = entry;
        while (current.parent) {
          const parentEntry = state.genreMap.get(current.parent.name || current.parent.style);
          if (!parentEntry) break;
          current = parentEntry;
        }
        const topLevelAncestor = current.data;
        const accentColor = state.colorScale(topLevelAncestor.name || topLevelAncestor.style);
        showInfoPanel(targetGenre, accentColor);

        if (state.treeRoot) {
          const genreName = targetGenre.name || targetGenre.style;
          const d3Node = state.treeRoot.descendants().find(d => d.data.name === genreName && d.depth > 0);
          if (d3Node) {
            const nodeElements = d3.selectAll('.node').filter(n => n === d3Node);
            if (!nodeElements.empty()) {
              const element = nodeElements.node();
              state.activeSelectedNode = d3Node;
              highlightBranch(element, d3Node);
              scrollToNode(d3Node);
            }
          }
        }
      }
    }
  } else {
    if (infoPanel.classList.contains('visible')) {
      closeInfoPanel();
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  applyI18nToDOM();
  fetchData();

  // Language selector: set correct URLs and highlight current language
  const langBase = state.BASE_PATH || '';
  const enBtn = document.getElementById('lang-btn-en');
  const esBtn = document.getElementById('lang-btn-es');
  if (enBtn) enBtn.href = langBase + '/';
  if (esBtn) esBtn.href = langBase + '/es/';
  const langBtns = document.querySelectorAll('.lang-btn');
  const currentLang = window.PR_LANG || 'en';
  langBtns.forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
  });

  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileClearButton = document.getElementById('mobile-clear-button');
  if (mobileSearchInput) {
    const debouncedMobileSearch = debounce((term) => performSearch(term), 300);
    mobileSearchInput.addEventListener('input', (e) => {
      const term = e.target.value;
      debouncedMobileSearch(term);
      mobileClearButton.classList.toggle('hidden', !term);
    });
    mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });
  }

  if (mobileClearButton) {
    mobileClearButton.addEventListener('click', () => {
      mobileSearchInput.value = '';
      performSearch('');
      mobileClearButton.classList.add('hidden');
      mobileSearchInput.focus();
    });
  }

  document.getElementById('modal-overlay').addEventListener('click', closeInfoPanel);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const infoPanel = document.getElementById('info-panel');
      if (infoPanel.classList.contains('visible')) {
        closeInfoPanel();
      }
    }
  });

  window.addEventListener('popstate', () => {
    handleUrl();
  });

  const mobileNavContainer = document.getElementById('mobile-genre-list');
  mobileNavContainer.addEventListener('click', (event) => {
    const target = event.target;
    const itemElement = target.closest('.genre-item');
    if (!itemElement) return;

    const action = target.dataset.action || itemElement.dataset.action;
    const itemData = JSON.parse(itemElement.dataset.itemData);
    const accentColor = itemElement.style.getPropertyValue('--genre-color');

    switch (action) {
      case 'toggle': {
        const subListId = itemElement.getAttribute('aria-controls');
        if (subListId) {
          const subList = document.getElementById(subListId);
          subList.classList.toggle('expanded');
          const isExpanded = subList.classList.contains('expanded');
          itemElement.setAttribute('aria-expanded', isExpanded);
          saveAccordionState();
        }
        break;
      }
      case 'info':
        event.stopPropagation();
        showInfoPanel(itemData, accentColor);
        break;
      case 'wiki':
        event.stopPropagation();
        break;
    }
  });

  setupDesktopSearch();

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const infoBox = document.getElementById('tooltip');
  if (infoBox) {
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = str('readMore');
    readMoreBtn.className = 'read-more-btn';

    infoBox.appendChild(readMoreBtn);

    readMoreBtn.addEventListener('click', () => {
      const isExpanded = infoBox.classList.toggle('is-expanded');
      readMoreBtn.textContent = isExpanded ? str('readLess') : str('readMore');
    });
  }

  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn) {
    const originalIconClass = 'bi-clipboard';
    const successIconClass = 'bi-clipboard-check-fill';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const icon = copyBtn.querySelector('i');
        icon.classList.remove(originalIconClass);
        icon.classList.add(successIconClass);
        copyBtn.setAttribute('aria-label', str('linkCopied'));

        setTimeout(() => {
          icon.classList.remove(successIconClass);
          icon.classList.add(originalIconClass);
          copyBtn.setAttribute('aria-label', str('copyLinkToClipboard'));
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        copyBtn.setAttribute('aria-label', str('failedToCopy'));
      });
    });
  }

  const backToTopBtn = document.getElementById('back-to-top-btn');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
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

  initFullscreen();

  const headerShareBtn = document.getElementById('header-share-btn');
  const sharePopover = document.getElementById('share-popover');
  if (headerShareBtn && sharePopover) {
    function updateShareLinks() {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title || 'PulseRoots: Electronic Music Styles Tree');
      const text = encodeURIComponent('Explore the evolution of electronic music with PulseRoots!');
      const links = sharePopover.querySelectorAll('a.share-popover-btn');
      if (links[0]) links[0].href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      if (links[1]) links[1].href = `https://x.com/intent/tweet?url=${url}&text=${text}`;
      if (links[2]) links[2].href = `https://www.reddit.com/submit?url=${url}&title=${title}`;
    }

    function openSharePopover() {
      updateShareLinks();
      sharePopover.classList.add('visible');
    }

    function closeSharePopover() {
      sharePopover.classList.remove('visible');
    }

    headerShareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sharePopover.classList.contains('visible')) {
        closeSharePopover();
      } else {
        openSharePopover();
      }
    });

    document.addEventListener('click', (e) => {
      if (!headerShareBtn.contains(e.target) && !sharePopover.contains(e.target)) {
        closeSharePopover();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSharePopover();
    });

    const popoverCopyBtn = document.getElementById('share-popover-copy');
    if (popoverCopyBtn) {
      const popoverCopyIcon = popoverCopyBtn.querySelector('i');
      popoverCopyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(window.location.href);
          const originalIcon = popoverCopyIcon.className;
          popoverCopyIcon.className = 'bi bi-check-lg';
          popoverCopyBtn.classList.add('success');
          setTimeout(() => {
            popoverCopyIcon.className = originalIcon;
            popoverCopyBtn.classList.remove('success');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
      });
    }
  }

  initThemeToggle();

  // Persistent mini-player handlers
  const miniPlayer = document.getElementById('mini-player');
  if (miniPlayer) {
    miniPlayer.addEventListener('click', (event) => {
      if (event.target.closest('#mini-player-close')) return;
      reopenPanel();
    });
  }

  const miniPlayerClose = document.getElementById('mini-player-close');
  if (miniPlayerClose) {
    miniPlayerClose.addEventListener('click', (event) => {
      event.stopPropagation();
      stopMiniPlayer();
    });
  }

  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  initShuffle();

  function createRipple(e) {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  document.querySelectorAll('#clear-button, #shuffle-button, #fullscreen-btn, #header-share-btn, #theme-toggle-btn, #header-contact-btn, .layout-btn, #back-to-top-btn, .share-popover-btn').forEach(btn => {
    btn.addEventListener('click', createRipple);
  });

  const historyBanner = document.getElementById('history-banner');
  const historyFactSpan = document.getElementById('history-fact');
  historyFactSpan.style.opacity = '1';
  let historyInterval;

  async function fetchHistoryFacts(retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
    const langSuffix = window.PR_LANG && window.PR_LANG !== 'en' ? `.${window.PR_LANG}` : '';
        const response = await fetch(`${state.BASE_PATH}/data/music_history${langSuffix}.json`);
        const facts = await response.json();
        return facts;
      } catch (error) {
        console.error('Error fetching music history facts:', error);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    return [];
  }

  function displayRandomFact(facts) {
    if (facts.length === 0) {
      historyBanner.style.display = 'none';
      return;
    }

    historyFactSpan.style.opacity = '0';
    historyFactSpan.style.transform = 'translateY(8px)';

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * facts.length);
      const fact = facts[randomIndex];
      historyFactSpan.innerHTML = `<strong>${fact.date}:</strong> ${fact.fact}`;
      historyBanner.style.display = 'block';
      requestAnimationFrame(() => {
        historyFactSpan.style.opacity = '1';
        historyFactSpan.style.transform = 'translateY(0)';
      });
    }, 500);
  }

  async function startHistoryBanner() {
    const facts = await fetchHistoryFacts();
    if (facts.length > 0) {
      displayRandomFact(facts);
      historyInterval = setInterval(() => displayRandomFact(facts), 10000);
    }
  }

  startHistoryBanner();

  if (window.innerWidth > 1024) {
    initParticles();
  }
});
