const fs = require('fs');
const path = require('path');
const https = require('https');

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const value = trimmed.substring(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

function translateText(text, apiKey, retries = 3) {
  return new Promise((resolve, reject) => {
    if (!text || text.trim().length === 0) return resolve(text);

    const postData = JSON.stringify({
      text: [text],
      target_lang: 'ES',
      source_lang: 'EN',
      tag_handling: 'xml'
    });

    const url = new URL(DEEPL_API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PulseRoots-Translator/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result.translations[0].text);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        } else if (res.statusCode === 429 && retries > 0) {
          console.log(`  Rate limited, retrying in 2s... (${retries} retries left)`);
          setTimeout(() => {
            translateText(text, apiKey, retries - 1).then(resolve).catch(reject);
          }, 2000);
        } else if (res.statusCode === 456 && retries > 0) {
          console.log(`  Quota exceeded, retrying in 10s... (${retries} retries left)`);
          setTimeout(() => {
            translateText(text, apiKey, retries - 1).then(resolve).catch(reject);
          }, 10000);
        } else {
          reject(new Error(`DeepL API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function translateTree(items, apiKey, depth = 0) {
  const indent = '  '.repeat(depth);
  let translatedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.name || item.style || 'unknown';

    if (item.description) {
      process.stdout.write(`${indent}Translating "${name}"... `);
      try {
        const translated = await translateText(item.description, apiKey);
        item.description = translated;
        process.stdout.write('✓\n');
        translatedCount++;
      } catch (err) {
        process.stdout.write(`✗ ${err.message}\n`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (item.substyles && item.substyles.length > 0) {
      const childCount = await translateTree(item.substyles, apiKey, depth + 1);
      translatedCount += childCount;
    }
  }

  return translatedCount;
}

async function translateHistory(historyItems, apiKey) {
  let translatedCount = 0;

  for (let i = 0; i < historyItems.length; i++) {
    const item = historyItems[i];

    if (item.fact) {
      process.stdout.write(`  Translating history entry ${i + 1}/${historyItems.length} (${item.date})... `);
      try {
        const translated = await translateText(item.fact, apiKey);
        item.fact = translated;
        process.stdout.write('✓\n');
        translatedCount++;
      } catch (err) {
        process.stdout.write(`✗ ${err.message}\n`);
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return translatedCount;
}

async function main() {
  loadEnv();

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error('Error: DEEPL_API_KEY not found in .env or environment.');
    console.error('');
    console.error('To get a free DeepL API key:');
    console.error('  1. Go to https://www.deepl.com/pro#developer');
    console.error('  2. Sign up for the free DeepL API plan (500K chars/month)');
    console.error('  3. Add to .env: DEEPL_API_KEY=your_key_here');
    console.error('');
    console.error('Or set the environment variable:');
    console.error('  $env:DEEPL_API_KEY="your_key_here"');
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'data');

  // --- Translate genre descriptions ---
  console.log('\n--- Translating genre descriptions ---');
  const genresPath = path.join(dataDir, 'pulseroots.genres.json');
  const genresOutputPath = path.join(dataDir, 'pulseroots.genres.es.json');

  const genresData = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));
  const genreCount = await translateTree(genresData, apiKey);
  fs.writeFileSync(genresOutputPath, JSON.stringify(genresData, null, 4), 'utf-8');
  console.log(`\n✓ Genre translations complete: ${genreCount} descriptions translated`);
  console.log(`  Output: ${genresOutputPath}`);

  // --- Translate music history ---
  console.log('\n--- Translating music history ---');
  const historyPath = path.join(dataDir, 'music_history.json');
  const historyOutputPath = path.join(dataDir, 'music_history.es.json');

  const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  const historyCount = await translateHistory(historyData, apiKey);
  fs.writeFileSync(historyOutputPath, JSON.stringify(historyData, null, 2), 'utf-8');
  console.log(`\n✓ History translations complete: ${historyCount} entries translated`);
  console.log(`  Output: ${historyOutputPath}`);

  console.log('\n✅ All translations complete!');
  console.log('Next step: manually review music terminology in the Spanish files.');
  console.log('Then run: node build.js --lang es');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
