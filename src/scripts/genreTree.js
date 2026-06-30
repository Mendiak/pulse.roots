import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getAllGenres(genres) {
  let allGenres = [];

  const traverse = (items, currentSlugPathParts) => {
    for (const item of items) {
      const genreName = item.name || item.style;
      if (!genreName) continue;

      const currentSlug = slugify(genreName);
      const fullSlugPath = currentSlugPathParts.length > 0
        ? [...currentSlugPathParts, currentSlug].join('/')
        : currentSlug;

      allGenres.push({ genreName, fullSlugPath });

      if (item.substyles && item.substyles.length > 0) {
        traverse(item.substyles, [...currentSlugPathParts, currentSlug]);
      }
    }
  };

  traverse(genres, []);
  return allGenres;
}

export function generateGenreTreeHtml(lang = 'en') {
  const isDefault = lang === 'en';
  const fileName = isDefault ? 'pulseroots.genres.json' : `pulseroots.genres.${lang}.json`;
  const filePath = path.join(dataDir, fileName);

  if (!fs.existsSync(filePath)) {
    const enPath = path.join(dataDir, 'pulseroots.genres.json');
    if (!fs.existsSync(enPath)) return '';
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const allGenres = getAllGenres(enData);
    return buildTreeHtml(allGenres, '');
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const allGenres = getAllGenres(data);
  return buildTreeHtml(allGenres, lang);
}

function buildTreeHtml(allGenres, lang) {
  const prefix = lang ? `/${lang}` : '';

  const childrenMap = {};
  for (const info of allGenres) {
    const parts = info.fullSlugPath.split('/');
    const parentKey = parts.slice(0, -1).join('/');
    if (!childrenMap[parentKey]) childrenMap[parentKey] = [];
    childrenMap[parentKey].push(info);
  }

  for (const key of Object.keys(childrenMap)) {
    childrenMap[key].sort((a, b) => a.genreName.localeCompare(b.genreName));
  }

  function buildNestedList(parentKey) {
    const children = childrenMap[parentKey];
    if (!children || children.length === 0) return '';

    let html = '        <ul>\n';
    for (const child of children) {
      const url = `${prefix}/genres/${child.fullSlugPath}.html`;
      const grandChildren = childrenMap[child.fullSlugPath];

      if (grandChildren && grandChildren.length > 0) {
        html += `          <li>\n`;
        html += `            <details>\n`;
        html += `              <summary><a href="${url}">${escapeHtml(child.genreName)}</a></summary>\n`;
        html += buildNestedList(child.fullSlugPath);
        html += `            </details>\n`;
        html += `          </li>\n`;
      } else {
        html += `          <li><a href="${url}">${escapeHtml(child.genreName)}</a></li>\n`;
      }
    }
    html += '        </ul>\n';
    return html;
  }

  const topLevel = childrenMap[''] || [];
  topLevel.sort((a, b) => a.genreName.localeCompare(b.genreName));

  let html = '';
  for (const top of topLevel) {
    const url = `${prefix}/genres/${top.fullSlugPath}.html`;
    html += `      <details>\n        <summary><a href="${url}">${escapeHtml(top.genreName)}</a></summary>\n`;
    html += buildNestedList(top.fullSlugPath);
    html += `      </details>\n`;
  }
  return html;
}
