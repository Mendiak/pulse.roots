/**
 * Validate i18n keys across language files
 * Checks that all keys in en.json exist in all other language files
 */
const fs = require('fs');
const path = require('path');

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const i18nDir = path.join(__dirname, '..', 'data', 'i18n');
const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json'));

if (files.length < 2) {
  console.log('Need at least 2 language files to compare.');
  process.exit(0);
}

const refFile = 'en.json';
if (!files.includes(refFile)) {
  console.error(`Reference file ${refFile} not found.`);
  process.exit(1);
}

const refData = JSON.parse(fs.readFileSync(path.join(i18nDir, refFile), 'utf-8'));
const refKeys = new Set(getAllKeys(refData));

let exitCode = 0;

for (const file of files) {
  if (file === refFile) continue;
  const data = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf-8'));
  const keys = new Set(getAllKeys(data));

  const missing = [...refKeys].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !refKeys.has(k));

  if (missing.length > 0) {
    console.log(`\n\x1b[33m${file}: Missing keys (present in ${refFile} but not in ${file}):\x1b[0m`);
    missing.forEach(k => console.log(`  · ${k}`));
    exitCode = 1;
  }
  if (extra.length > 0) {
    console.log(`\n\x1b[33m${file}: Extra keys (present in ${file} but not in ${refFile}):\x1b[0m`);
    extra.forEach(k => console.log(`  · ${k}`));
    exitCode = 1;
  }
  if (missing.length === 0 && extra.length === 0) {
    console.log(`\x1b[32m✓ ${file}: All keys match ${refFile}\x1b[0m`);
  }
}

if (exitCode === 0) {
  console.log(`\n\x1b[32m✓ All i18n files are in sync with ${refFile}.\x1b[0m`);
}
process.exit(exitCode);
