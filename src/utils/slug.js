/**
 * Shared slug builder used by both the build (Astro) and the browser bundle.
 * Diacritics are transliterated instead of dropped, so "Musique Concrète"
 * becomes "musique-concrete" rather than "musique-concrte".
 */

const CHAR_MAP = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
};

export function slugify(text) {
  if (!text) return '';

  const mapped = text
    .toString()
    .replace(/[ßæœøłđðþı]/gi, char => CHAR_MAP[char.toLowerCase()] || char);

  return mapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
