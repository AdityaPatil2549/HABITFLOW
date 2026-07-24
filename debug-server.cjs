const http = require('http');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      console.log('BROWSER LOG:', body);
      res.end('ok');
    });
  } else {
    res.end('alive');
  }
}).listen(3333, () => console.log('Debug server listening on 3333'));
