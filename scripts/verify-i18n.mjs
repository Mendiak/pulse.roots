/**
 * i18n gate: keeps the translation files in sync and makes sure every key used
 * in the code actually exists. Runs before the deploy, next to verify-seo.
 *
 *   node scripts/verify-i18n.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const I18N_DIR = path.resolve('public/data/i18n');
const LOCALES = ['en', 'es'];

const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const dictionaries = {};
for (const locale of LOCALES) {
  const file = path.join(I18N_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) {
    fail(`missing dictionary: public/data/i18n/${locale}.json`);
    continue;
  }
  dictionaries[locale] = JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const base = dictionaries.en;

if (base) {
  const baseKeys = new Set(flatten(base));

  for (const locale of LOCALES.filter(l => l !== 'en' && dictionaries[l])) {
    const keys = new Set(flatten(dictionaries[locale]));

    for (const key of baseKeys) {
      if (!keys.has(key)) fail(`${locale}.json is missing "${key}"`);
    }
    for (const key of keys) {
      if (!baseKeys.has(key)) fail(`${locale}.json has an extra key "${key}"`);
    }

    const empty = [...keys].filter(key => {
      const value = key.split('.').reduce((obj, part) => obj?.[part], dictionaries[locale]);
      return typeof value === 'string' && value.trim() === '';
    });
    for (const key of empty) fail(`${locale}.json has an empty value for "${key}"`);
  }
}

/* -------------------------------------------------- keys used in the source */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(js|astro)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const usedKeys = new Map();
for (const file of walk(path.resolve('src'))) {
  const source = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(process.cwd(), file);

  for (const match of source.matchAll(/(?<![A-Za-z0-9_.$])t\(\s*['"]([^'"]+)['"]/g)) {
    usedKeys.set(match[1], rel);
  }
  for (const match of source.matchAll(/data-i18n(?:-html|-placeholder|-title|-aria-label)?="([^"]+)"/g)) {
    usedKeys.set(match[1], rel);
  }
}

if (base) {
  const baseKeys = new Set(flatten(base));
  for (const [key, file] of usedKeys) {
    if (!baseKeys.has(key)) fail(`"${key}" is used in ${file} but is not defined in en.json`);
  }
}

/* ------------------------------------------------------------------ report */
const summary = LOCALES.map(locale =>
  dictionaries[locale] ? `${locale}: ${flatten(dictionaries[locale]).length} keys` : `${locale}: missing`
).join(' · ');

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const warning of warnings) console.log(`   - ${warning}`);
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} i18n error(s) — ${summary}\n`);
  for (const error of errors) console.error(`   - ${error}`);
  process.exit(1);
}

console.log(`\n✅ i18n checks passed — ${summary} · ${usedKeys.size} keys referenced in code`);
