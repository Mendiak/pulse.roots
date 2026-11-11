// Generates the static genre-map images used as og:image and as real content
// images on the family pages. The site is sold as a map, so it should contain
// one: search engines cannot see a D3 canvas, only an <img>.
//
// Output: public/assets/maps/<slug>-<lang>.webp (1200x630) plus the full tree
// for the home page. Regenerated on every build, so they never go stale.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { slugify } from '../src/utils/slug.js';

const OUT_DIR = 'public/assets/maps';
const WIDTH = 1200;
const HEIGHT = 630;

const BG = '#080808';
const PINK = '#ff0066';
const TEXT = '#f5f5f5';
const MUTED = '#8a8a8a';
const FONT = "DejaVu Sans, Segoe UI, Arial, Helvetica, sans-serif";

const COPY = {
  en: {
    kicker: 'PULSEROOTS · ELECTRONIC MUSIC GENRE TREE',
    styles: 'styles',
    branches: 'branches',
    all: '307 styles across 14 families',
    alt: name => `${name}: its styles and substyles on the PulseRoots electronic music genre tree`,
    altAll: 'The PulseRoots electronic music genre tree: 14 families and 307 styles',
  },
  es: {
    kicker: 'PULSEROOTS · ÁRBOL DE GÉNEROS DE MÚSICA ELECTRÓNICA',
    styles: 'estilos',
    branches: 'ramas',
    all: '307 estilos en 14 familias',
    alt: name => `${name}: sus estilos y subestilos en el árbol de géneros de PulseRoots`,
    altAll: 'El árbol de géneros de música electrónica de PulseRoots: 14 familias y 307 estilos',
  },
};

const escapeXml = text => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Greedy wrap on a character budget, because we cannot measure text in SVG. */
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function countNodes(items) {
  let total = 0;
  const walk = nodes => {
    for (const node of nodes || []) {
      total += 1;
      walk(node.substyles);
    }
  };
  walk(items);
  return total;
}

function familyCard({ name, styleCount, subCount }, copy) {
  const subtitle = `${subCount} ${copy.styles} · ${styleCount} ${copy.branches}`;
  const titleSize = name.length <= 16 ? 68 : name.length <= 26 ? 56 : 46;
  const maxChars = Math.floor(520 / (titleSize * 0.56));
  const lines = wrap(name, maxChars);
  const startY = 300 - ((lines.length - 1) * titleSize * 0.55);

  const titleSvg = lines.map((line, index) =>
    `<text x="80" y="${Math.round(startY + index * titleSize * 1.1)}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="${TEXT}">${escapeXml(line)}</text>`,
  ).join('\n    ');

  const radius = 196;
  const cx = 890;
  const cy = 330;

  let nodes = '';
  for (let index = 0; index < styleCount; index += 1) {
    const angle = (index / styleCount) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const midX = cx + Math.cos(angle) * (radius * 0.45);
    const midY = cy + Math.sin(angle) * (radius * 0.45);
    nodes += `<path d="M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${PINK}" stroke-opacity="0.18" stroke-width="1"/>`;
    nodes += `<circle cx="${midX.toFixed(1)}" cy="${midY.toFixed(1)}" r="2.5" fill="${PINK}" fill-opacity="0.55"/>`;
    nodes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${PINK}" fill-opacity="0.85"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BG}"/>
        <stop offset="1" stop-color="#1a0410"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${PINK}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="${PINK}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <circle cx="${cx}" cy="${cy}" r="300" fill="url(#glow)"/>
    <text x="80" y="96" font-family="${FONT}" font-size="17" letter-spacing="2.5" fill="${PINK}">${escapeXml(copy.kicker)}</text>
    ${titleSvg}
    <text x="80" y="${Math.round(startY + lines.length * titleSize * 1.1 + 26)}" font-family="${FONT}" font-size="24" fill="${MUTED}">${subtitle}</text>
    <rect x="80" y="512" width="64" height="4" fill="${PINK}"/>
    <g>${nodes}</g>
    <circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="${PINK}" stroke-width="2"/>
    <text x="${cx}" y="${cy + 12}" font-family="${FONT}" font-size="34" font-weight="700" fill="${TEXT}" text-anchor="middle">${styleCount}</text>
  </svg>`;
}

function overviewCard(families, copy) {
  const cx = 600;
  const cy = 380;
  const radiusInner = 108;
  const radiusOuter = 185;
  const labelRadius = 222;
  const step = (Math.PI * 2) / families.length;

  let nodes = '';
  families.forEach((family, index) => {
    const angle = index * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * radiusOuter;
    const y = cy + Math.sin(angle) * radiusOuter;
    const ix = cx + Math.cos(angle) * radiusInner;
    const iy = cy + Math.sin(angle) * radiusInner;
    nodes += `<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${PINK}" stroke-opacity="0.35" stroke-width="1.5"/>`;
    nodes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${PINK}"/>`;
    const labelX = cx + Math.cos(angle) * labelRadius;
    const labelY = cy + Math.sin(angle) * labelRadius + 5;
    const anchor = Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle';
    nodes += `<text x="${labelX.toFixed(0)}" y="${labelY.toFixed(0)}" font-family="${FONT}" font-size="16" fill="${TEXT}" text-anchor="${anchor}">${escapeXml(family.name)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BG}"/>
        <stop offset="1" stop-color="#1a0410"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${PINK}" stop-opacity="0.20"/>
        <stop offset="1" stop-color="${PINK}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <circle cx="${cx}" cy="${cy}" r="330" fill="url(#glow)"/>
    <text x="600" y="62" font-family="${FONT}" font-size="17" letter-spacing="2.5" fill="${PINK}" text-anchor="middle">${escapeXml(copy.kicker)}</text>
    <text x="600" y="112" font-family="${FONT}" font-size="38" font-weight="700" fill="${TEXT}" text-anchor="middle">${escapeXml(copy.all)}</text>
    <g>${nodes}</g>
    <circle cx="${cx}" cy="${cy}" r="58" fill="none" stroke="${PINK}" stroke-width="2"/>
    <text x="${cx}" y="${cy + 2}" font-family="${FONT}" font-size="38" font-weight="700" fill="${TEXT}" text-anchor="middle">307</text>
    <text x="${cx}" y="${cy + 26}" font-family="${FONT}" font-size="14" fill="${MUTED}" text-anchor="middle">${copy.styles}</text>
  </svg>`;
}

async function write(slug, svg) {
  // JPEG, not WebP: the same file is used as og:image and LinkedIn/Facebook do
  // not reliably render WebP previews.
  await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT_DIR, `${slug}.jpg`));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const images = [];

  for (const lang of ['en', 'es']) {
    const file = lang === 'en'
      ? 'public/data/pulseroots.genres.json'
      : 'public/data/pulseroots.genres.es.json';
    const families = JSON.parse(await fs.readFile(file, 'utf-8'));
    const copy = COPY[lang];

    const prepared = families.map(family => {
      const name = family.style || family.name;
      const children = family.substyles || [];
      return {
        name,
        slug: slugify(name),
        styleCount: children.length,
        subCount: countNodes(children),
      };
    });

    for (const family of prepared) {
      // Names are derived in the components too; keep both in sync through
      // `family-<slug>-<lang>.webp`.
      await write(`family-${family.slug}-${lang}`, familyCard(family, copy));
      images.push(`family-${family.slug}-${lang}`);
    }

    await write(`overview-${lang}`, overviewCard(prepared, copy));
    images.push(`overview-${lang}`);
  }

  console.log(`Generated ${images.length} map images in ${OUT_DIR}.`);
}

await main();
