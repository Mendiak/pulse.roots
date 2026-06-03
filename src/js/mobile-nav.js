import { state } from './state.js';
import { slugify } from './utils.js';
import { showInfoPanel } from './panel.js';

export function createMobileNav(items, parentElement, parentColor = null) {
  items.forEach(item => {
    const baseId = `${slugify(item.name || item.style)}-${Math.random().toString(36).substr(2, 9)}`;
    const subListId = `sub-list-${baseId}`;

    const listItem = document.createElement('li');
    const isButton = item.substyles && item.substyles.length > 0;
    const itemElement = document.createElement(isButton ? 'button' : 'div');
    if (isButton) itemElement.setAttribute('type', 'button');

    itemElement.dataset.action = 'toggle';
    itemElement.dataset.itemData = JSON.stringify(item);
    itemElement.className = 'genre-item';

    const currentColor = parentColor || state.colorScale(item.name || item.style);
    itemElement.style.setProperty('--genre-color', currentColor);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'genre-name';
    nameSpan.textContent = item.name || item.style;
    nameSpan.dataset.originalText = item.name || item.style;
    itemElement.appendChild(nameSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'genre-actions';

    if (item.wikipedia_url) {
      const wikiIconLink = document.createElement('a');
      wikiIconLink.href = item.wikipedia_url;
      wikiIconLink.target = '_blank';
      wikiIconLink.rel = 'noopener noreferrer';
      wikiIconLink.className = 'bi bi-wikipedia wiki-icon';
      wikiIconLink.dataset.action = 'wiki';
      wikiIconLink.setAttribute('aria-label', `Read more about ${item.name || item.style} on Wikipedia`);
      actionsDiv.appendChild(wikiIconLink);
    }

    const infoIcon = document.createElement('i');
    infoIcon.className = 'bi bi-info-circle-fill info-icon';
    infoIcon.dataset.action = 'info';
    infoIcon.setAttribute('aria-label', `Info for ${item.name || item.style}`);
    actionsDiv.appendChild(infoIcon);

    if (item.substyles && item.substyles.length > 0) {
      const indicator = document.createElement('span');
      indicator.className = 'indicator';
      indicator.innerHTML = '&#43;';
      actionsDiv.appendChild(indicator);

      const buttonId = `btn-${baseId}`;
      itemElement.id = buttonId;
      itemElement.setAttribute('aria-expanded', 'false');
      itemElement.setAttribute('aria-controls', subListId);

      const subList = document.createElement('ul');
      subList.className = 'sub-list';
      subList.id = subListId;
      subList.setAttribute('role', 'region');
      subList.setAttribute('aria-labelledby', buttonId);
      createMobileNav(item.substyles, subList, currentColor);

      listItem.appendChild(itemElement);
      listItem.appendChild(subList);
    } else {
      itemElement.dataset.action = 'info';
      itemElement.setAttribute('role', 'button');
      itemElement.setAttribute('tabindex', '0');

      itemElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showInfoPanel(item, currentColor);
        }
      });

      listItem.appendChild(itemElement);
    }

    itemElement.appendChild(actionsDiv);
    parentElement.appendChild(listItem);
  });
}

export function saveAccordionState() {
  const expandedItems = document.querySelectorAll('#mobile-genre-list .sub-list.expanded');
  const expandedIds = Array.from(expandedItems).map(item => item.id);
  localStorage.setItem('pulseRootsAccordionState', JSON.stringify(expandedIds));
}

export function restoreAccordionState() {
  const savedState = localStorage.getItem('pulseRootsAccordionState');
  if (!savedState) return;

  try {
    const expandedIds = JSON.parse(savedState);
    if (Array.isArray(expandedIds)) {
      expandedIds.forEach(id => {
        const subList = document.getElementById(id);
        const controllingButton = document.querySelector(`[aria-controls="${id}"]`);
        if (subList && controllingButton) {
          subList.classList.add('expanded');
          controllingButton.setAttribute('aria-expanded', 'true');
        }
      });
    }
  } catch (e) {
    console.error('Error parsing accordion state from localStorage:', e);
    localStorage.removeItem('pulseRootsAccordionState');
  }
}
