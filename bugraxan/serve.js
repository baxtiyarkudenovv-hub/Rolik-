// Кишкене статик сервер (ES-модуллер file:// арқалы жүклемейди)
const http = require('http'), fs = require('fs'), path = require('path');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
module.exports = (port = 0) => new Promise(res => {
  const s = http.createServer((q, r) => {
    const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
  }).listen(port, () => res({ url: `http://127.0.0.1:${s.address().port}`, close: () => s.close() }));
});
