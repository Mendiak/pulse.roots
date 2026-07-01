import { state } from './state.js';
import { escapeRegex, debounce, slugify } from './utils.js';

export function performSearch(searchTerm) {
  const term = searchTerm.toLowerCase();

  const treeNodes = d3.selectAll('.node');
  treeNodes.classed('searched-node', false);
  if (term) {
    treeNodes
      .filter(d => d.data.name.toLowerCase().includes(term))
      .classed('searched-node', true);
  }

  const mobileListItems = document.querySelectorAll('#mobile-genre-list li');
  if (!mobileListItems.length) return;

  if (!term) {
    mobileListItems.forEach(li => {
      li.style.display = 'block';
      const itemElement = li.querySelector('.genre-item');
      const nameSpan = itemElement.querySelector('.genre-name');
      itemElement.classList.remove('searched-item');
      nameSpan.innerHTML = nameSpan.dataset.originalText;
    });
    state.matchedNodes = [];
    state.currentMatchIndex = -1;
    const searchNav = document.getElementById('search-nav');
    if (searchNav) searchNav.classList.add('hidden');
    d3.selectAll('.node').classed('active-searched-node', false);
    d3.select('#search-highlight-box').remove();
    return;
  }

  mobileListItems.forEach(li => {
    const itemElement = li.querySelector('.genre-item');
    const nameSpan = itemElement.querySelector('.genre-name');
    const originalText = nameSpan.dataset.originalText;
    const isMatch = originalText.toLowerCase().includes(term);

    if (isMatch) {
      itemElement.classList.add('searched-item');
      const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
      nameSpan.innerHTML = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');

      let parent = li.parentElement;
      while (parent && parent.id !== 'mobile-genre-list') {
        if (parent.classList.contains('sub-list')) {
          parent.classList.add('expanded');
          const controllingButton = document.querySelector(`[aria-controls="${parent.id}"]`);
          if (controllingButton) {
            controllingButton.setAttribute('aria-expanded', 'true');
          }
        }
        parent = parent.parentElement;
      }
    }
  });

  mobileListItems.forEach(li => li.style.display = 'none');
  mobileListItems.forEach(li => {
    const nameSpan = li.querySelector('.genre-name');
    const originalText = nameSpan.dataset.originalText;
    if (originalText.toLowerCase().includes(term)) {
      li.style.display = 'block';
      let parent = li.parentElement;
      while (parent) {
        if (parent.tagName === 'LI') parent.style.display = 'block';
        if (parent.id === 'mobile-genre-list') break;
        parent = parent.parentElement;
      }
    }
  });

  const searchNav = document.getElementById('search-nav');

  state.matchedNodes = treeNodes.filter(d => d.data.name.toLowerCase().includes(term)).data();

  if (state.matchedNodes.length > 0) {
    if (searchNav) searchNav.classList.remove('hidden');
    navigateToMatch(0);
  } else {
    if (searchNav) searchNav.classList.add('hidden');
    state.currentMatchIndex = -1;
  }
}

export function navigateToMatch(index) {
  if (state.matchedNodes.length === 0) return;

  if (index < 0) index = state.matchedNodes.length - 1;
  if (index >= state.matchedNodes.length) index = 0;

  state.currentMatchIndex = index;
  const targetData = state.matchedNodes[state.currentMatchIndex];

  const searchCounter = document.getElementById('search-counter');
  if (searchCounter) {
    searchCounter.textContent = `${state.currentMatchIndex + 1} of ${state.matchedNodes.length}`;
  }

  d3.selectAll('.node')
    .classed('active-searched-node', false)
    .filter(d => d === targetData)
    .classed('active-searched-node', true);

  d3.select('#search-highlight-box').remove();

  const nodeSelection = d3.selectAll('.node').filter(d => d === targetData);
  const textElement = nodeSelection.select('text');

  if (!textElement.empty()) {
    const bbox = textElement.node().getBBox();
    const padding = 6;

    nodeSelection.insert('rect', 'text')
      .attr('id', 'search-highlight-box')
      .attr('class', 'search-highlight-rect')
      .attr('x', bbox.x - padding)
      .attr('y', bbox.y - padding)
      .attr('width', bbox.width + (padding * 2))
      .attr('height', bbox.height + (padding * 2))
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1);
  }

  scrollToNode(targetData);
}

function scrollToNode(d) {
  const nodeElements = d3.selectAll('.node').filter(n => n === d);
  if (nodeElements.empty()) return;

  const element = nodeElements.node();
  const rect = element.getBoundingClientRect();

  const scrollY = window.pageYOffset + rect.top - (window.innerHeight / 2);

  window.scrollTo({
    top: scrollY,
    behavior: 'smooth'
  });
}

export function setupDesktopSearch() {
  const searchInput = document.getElementById('search-input');
  const suggestionsContainer = document.getElementById('search-suggestions');
  const clearButton = document.getElementById('clear-button');
  let currentFocus = -1;

  const debouncedSearch = debounce((term) => performSearch(term), 300);

  function updateSuggestions(term) {
    if (!term) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.add('hidden');
      searchInput.setAttribute('aria-expanded', 'false');
      return;
    }

    const matches = Array.from(state.genreMap.values())
      .filter(entry => (entry.data.name || entry.data.style).toLowerCase().includes(term.toLowerCase()))
      .slice(0, 10);

    if (matches.length > 0) {
      suggestionsContainer.innerHTML = '';
      matches.forEach((match, index) => {
        const name = match.data.name || match.data.style;
        const familyNode = match.parent ? (function getRoot(node) {
          let curr = node;
          while (curr.parent) {
            const parentEntry = state.genreMap.get(curr.parent.name || curr.parent.style);
            if (!parentEntry) break;
            curr = parentEntry;
          }
          return curr.data.name || curr.data.style;
        })(match) : 'Family';

        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.setAttribute('role', 'option');
        div.setAttribute('aria-selected', 'false');
        div.innerHTML = `
          <span class="suggestion-name">${name}</span>
          <span class="suggestion-family">${familyNode}</span>
        `;

        div.addEventListener('click', async () => {
          searchInput.value = name;
          suggestionsContainer.innerHTML = '';
          suggestionsContainer.classList.add('hidden');
          searchInput.setAttribute('aria-expanded', 'false');

          performSearch(name);

          const d3Node = d3.selectAll('.clickable-node').filter(d => (d.data.name || d.data.style) === name).datum();
          if (d3Node) {
            const topLevelAncestor = d3Node.ancestors().find(ancestor => ancestor.depth === 1);
            const color = topLevelAncestor ? state.colorScale(topLevelAncestor.data.name) : '#ff0066';
            if (d3Node.data.spotify_track_id) {
              const { playGenre } = await import('./mini-player.js');
              playGenre(d3Node.data, color);
            } else {
              const { showInfoPanel } = await import('./panel.js');
              showInfoPanel(d3Node.data, color);
            }
          }
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.classList.remove('hidden');
      searchInput.setAttribute('aria-expanded', 'true');
    } else {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.add('hidden');
      searchInput.setAttribute('aria-expanded', 'false');
    }
  }

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value;
    updateSuggestions(term);
    debouncedSearch(term);
    clearButton.classList.toggle('hidden', !term);
  });

  searchInput.addEventListener('keydown', (event) => {
    const items = suggestionsContainer.getElementsByClassName('suggestion-item');
    if (event.key === 'ArrowDown') {
      currentFocus++;
      addActive(items);
    } else if (event.key === 'ArrowUp') {
      currentFocus--;
      addActive(items);
    } else if (event.key === 'Enter') {
      if (currentFocus > -1) {
        if (items[currentFocus]) items[currentFocus].click();
      } else {
        const term = searchInput.value;
        if (term) {
          if (state.matchedNodes.length > 0 && term.toLowerCase() === state.matchedNodes[0].data.name.toLowerCase().substring(0, term.length)) {
            navigateToMatch(state.currentMatchIndex + 1);
          } else {
            performSearch(term);
          }
          suggestionsContainer.classList.add('hidden');
          searchInput.setAttribute('aria-expanded', 'false');
        }
      }
    } else if (event.key === 'Escape') {
      suggestionsContainer.classList.add('hidden');
      searchInput.setAttribute('aria-expanded', 'false');
    }
  });

  function addActive(items) {
    if (!items) return;
    if (items.length === 0) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (items.length - 1);
    items[currentFocus].classList.add('active');
    items[currentFocus].setAttribute('aria-selected', 'true');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('active');
      items[i].setAttribute('aria-selected', 'false');
    }
  }

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    performSearch('');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.add('hidden');
    searchInput.setAttribute('aria-expanded', 'false');
    clearButton.classList.add('hidden');
    state.matchedNodes = [];
    state.currentMatchIndex = -1;
    const searchNav = document.getElementById('search-nav');
    if (searchNav) searchNav.classList.add('hidden');
  });

  const prevBtn = document.getElementById('search-prev');
  const nextBtn = document.getElementById('search-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToMatch(state.currentMatchIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToMatch(state.currentMatchIndex + 1);
    });
  }
}
