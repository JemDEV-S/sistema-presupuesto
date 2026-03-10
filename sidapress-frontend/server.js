import { createReadStream, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  // No manejar rutas /api/ (las maneja el backend via proxy de cPanel)
  if (req.url.startsWith('/api/')) {
    res.writeHead(502);
    res.end();
    return;
  }

  let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url);

  // Si el archivo no existe, servir index.html (SPA fallback para React Router)
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST, 'index.html');
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache para assets con hash (inmutable), sin cache para index.html
  const cacheControl = filePath.includes('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
  });

  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`SIDAPRESS frontend running on port ${PORT}`);
});
