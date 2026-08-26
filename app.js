const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

// When running under cPanel Phusion Passenger, process.env.PORT may be a named pipe path (string).
// If PORT is a string starting with / or pipe, we pass it directly to listen() without hostname.
const isPipe = typeof port === 'string' && (port.startsWith('/') || port.startsWith('\\\\'));
const hostname = isPipe ? undefined : (process.env.HOSTNAME || '0.0.0.0');

const app = next({ dev, hostname, port: isPipe ? undefined : Number(port) || 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  if (isPipe) {
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on pipe ${port}`);
    });
  } else {
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  }
});
