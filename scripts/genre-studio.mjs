import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ROOT,
  STAGING_FILE,
  loadCandidates,
  saveCandidates,
  loadTree,
  flattenTree,
  validateCandidate,
  counts,
  publishReady,
} from './lib/candidates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.join(HERE, 'studio');
const PORT = Number(process.env.STUDIO_PORT || 4310);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function state() {
  const store = loadCandidates();
  const tree = loadTree('en');
  const flat = flattenTree(tree);
  return {
    updatedAt: store.updatedAt,
    candidates: store.candidates,
    tree: flat,
    families: flat.filter(node => node.isFamily),
    counts: counts(store),
    stagingFile: path.relative(ROOT, STAGING_FILE).replace(/\\/g, '/'),
  };
}

function serveStatic(req, res, urlPath) {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(STUDIO_DIR, relative);
  if (!file.startsWith(STUDIO_DIR + path.sep) && file !== path.join(STUDIO_DIR, 'index.html')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  try {
    if (url.pathname === '/api/state' && req.method === 'GET') {
      sendJson(res, 200, state());
      return;
    }

    if (url.pathname === '/api/candidates' && req.method === 'POST') {
      const body = await readBody(req);
      if (!Array.isArray(body.candidates)) {
        sendJson(res, 400, { error: 'Se esperaba un array de candidatos.' });
        return;
      }
      const store = loadCandidates();
      store.candidates = body.candidates;
      saveCandidates(store);
      sendJson(res, 200, { ok: true, updatedAt: store.updatedAt, counts: counts(store) });
      return;
    }

    if (url.pathname === '/api/validate' && req.method === 'POST') {
      const body = await readBody(req);
      const tree = loadTree('en');
      const result = validateCandidate(body.candidate || {}, tree);
      sendJson(res, 200, result);
      return;
    }

    if (url.pathname === '/api/publish' && req.method === 'POST') {
      const body = await readBody(req);
      const result = publishReady({ dryRun: Boolean(body.dryRun) });
      sendJson(res, 200, { ...result, state: state() });
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Ruta no encontrada.' });
      return;
    }

    serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || 'Error interno.' });
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nEl puerto ${PORT} está ocupado. Cierra la otra ventana del panel o define STUDIO_PORT.\n`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log('');
  console.log('  PulseRoots · Panel de géneros');
  console.log(`  ${url}`);
  console.log('');
  console.log(`  Staging: ${path.relative(ROOT, STAGING_FILE)}`);
  console.log('  Cierra esta ventana para parar el panel.');
  console.log('');

  if (process.env.STUDIO_NO_OPEN !== '1') {
    const command =
      process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(command, () => {});
  }
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
