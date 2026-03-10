var http = require('http');
var fs = require('fs');
var path = require('path');

var DIST = path.join(__dirname, 'dist');

var MIME_TYPES = {
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

var server = http.createServer(function(req, res) {
  var url = req.url.split('?')[0];

  var filePath = path.join(DIST, url === '/' ? 'index.html' : url);

  // Si el archivo no existe, servir index.html (SPA fallback para React Router)
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(DIST, 'index.html');
  }

  var ext = path.extname(filePath);
  var contentType = MIME_TYPES[ext] || 'application/octet-stream';

  var cacheControl = filePath.indexOf('/assets/') !== -1
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  try {
    var content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen();
