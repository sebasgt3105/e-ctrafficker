const http = require('http');
const url = require('url');

const PORT = 80;

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // Si es /api -> proxy a backend
  if (pathname.startsWith('/api')) {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: '127.0.0.1'
      }
    };
    
    const proxy = http.request(options, (response) => {
      res.writeHead(response.statusCode, {
        ...response.headers,
        'Access-Control-Allow-Origin': '*'
      });
      response.pipe(res, { end: true });
    });
    
    proxy.on('error', (e) => {
      console.error('Proxy error:', e.message);
      res.writeHead(500);
      res.end('Proxy error');
    });
    
    req.pipe(proxy, { end: true });
  } else {
    // Todo lo demás -> frontend
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: '127.0.0.1'
      }
    };
    
    const proxy = http.request(options, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res, { end: true });
    });
    
    proxy.on('error', (e) => {
      console.error('Frontend proxy error:', e.message);
      res.writeHead(500);
      res.end('Frontend error');
    });
    
    req.pipe(proxy, { end: true });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Proxy running on http://0.0.0.0:${PORT}`);
});
