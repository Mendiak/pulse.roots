import { state } from './state.js';

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function truncateDescription(str, maxLength = 160) {
  if (!str || str.length <= maxLength) return str;
  const subString = str.substr(0, maxLength - 1);
  return subString.substr(0, subString.lastIndexOf(' ')) + '...';
}

export function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function buildGenreMap(data, parent = null) {
  data.forEach(item => {
    const name = item.name || item.style;
    state.genreMap.set(name, { data: item, parent: parent });
    if (item.substyles && item.substyles.length > 0) {
      buildGenreMap(item.substyles, item);
    }
  });
}

export function getGenrePath(genreData) {
  const genreName = (genreData.name || genreData.style);
  const entry = state.genreMap.get(genreName);

  if (!entry) {
    return slugify(genreData.name || genreData.style);
  }

  let pathParts = [slugify(entry.data.name || entry.data.style)];
  let current = entry;
  while (current && current.parent) {
    const parentName = (current.parent.name || current.parent.style);
    pathParts.unshift(slugify(parentName));
    current = state.genreMap.get(parentName);
  }
  return pathParts.join('/');
}

export function findGenre(identifier) {
  if (!identifier) return null;

  let entry = state.genreMap.get(identifier);
  if (entry) return entry.data;

  const slugToFind = identifier.toLowerCase();
  for (const [name, value] of state.genreMap.entries()) {
    if (slugify(name) === slugToFind) {
      return value.data;
    }
  }

  const pathSegments = identifier.split('/');
  let currentLevel = state.allGenreData;
  let foundGenre = null;

  for (const segment of pathSegments) {
    const segmentName = segment.replace(/-/g, ' ');
    const nextGenre = currentLevel.find(g => slugify(g.name || g.style) === segment);

    if (nextGenre) {
      foundGenre = nextGenre;
      currentLevel = nextGenre.substyles || [];
    } else {
      return null;
    }
  }
  return foundGenre;
}
